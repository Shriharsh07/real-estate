import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
export interface MediaItem {
  url: string;
  kind: "image" | "video";
  name: string;
  file?: File;
}
@Injectable({ providedIn: "root" })
export class MediaService {
  constructor(private http: HttpClient) {}
  async optimize(file: File, progress: (s: string) => void): Promise<File> {
    if (file.type.startsWith("image/")) {
      progress("Optimizing photo…");
      const bitmap = await createImageBitmap(file);
      try {
        const scale = Math.min(1, 2560 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas
          .getContext("2d")!
          .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/webp", 0.92),
        );
        return blob && blob.size < file.size
          ? new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
              type: blob.type,
            })
          : file;
      } finally {
        bitmap.close();
      }
    }
    progress("Optimizing video…");
    if (!("MediaRecorder" in window))
      throw new Error(
        "This browser cannot optimize videos. Please use a current desktop browser.",
      );
    const mime = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
    ].find((t) => MediaRecorder.isTypeSupported(t));
    if (!mime)
      throw new Error("Video optimization is unavailable in this browser.");
    const video = document.createElement("video");
    const source = URL.createObjectURL(file);
    video.src = source;
    video.playsInline = true;
    video.preload = "auto";
    let stream: MediaStream | undefined;
    let audioContext: AudioContext | undefined;
    try {
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error("Cannot read this video."));
      });
      if (!Number.isFinite(video.duration) || video.duration <= 0)
        throw new Error("Video duration is invalid.");
      const scale = Math.min(
        1,
        1080 / video.videoHeight,
        1920 / video.videoWidth,
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(
        2,
        Math.round((video.videoWidth * scale) / 2) * 2,
      );
      canvas.height = Math.max(
        2,
        Math.round((video.videoHeight * scale) / 2) * 2,
      );
      stream = canvas.captureStream(30);
      audioContext = new AudioContext();
      await audioContext.resume();
      const input = audioContext.createMediaElementSource(video);
      const destination = audioContext.createMediaStreamDestination();
      input.connect(destination);
      destination.stream.getAudioTracks().forEach((t) => stream!.addTrack(t));
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: 8000000,
        audioBitsPerSecond: 192000,
      });
      let frame = 0;
      const result = new Promise<Blob>((resolve, reject) => {
        recorder.ondataavailable = (e) => {
          if (e.data.size) chunks.push(e.data);
        };
        recorder.onerror = () =>
          reject(new Error("Video optimization failed."));
        recorder.onstop = () =>
          resolve(new Blob(chunks, { type: mime.split(";")[0] }));
        video.onended = () => {
          cancelAnimationFrame(frame);
          recorder.stop();
        };
        video.onerror = () => {
          cancelAnimationFrame(frame);
          if (recorder.state !== "inactive") recorder.stop();
          reject(new Error("Video playback failed."));
        };
      });
      const draw = () => {
        canvas
          .getContext("2d")!
          .drawImage(video, 0, 0, canvas.width, canvas.height);
        progress(
          "Optimizing video " +
            Math.min(
              99,
              Math.round((video.currentTime / video.duration) * 100),
            ) +
            "% — keep this tab open",
        );
        if (!video.ended) frame = requestAnimationFrame(draw);
      };
      recorder.start(1000);
      await video.play();
      draw();
      const blob = await result;
      return blob.size < file.size
        ? new File([blob], file.name.replace(/\.[^.]+$/, ".webm"), {
            type: "video/webm",
          })
        : file;
    } finally {
      video.pause();
      video.removeAttribute("src");
      video.load();
      stream?.getTracks().forEach((t) => t.stop());
      await audioContext?.close();
      URL.revokeObjectURL(source);
    }
  }
  async upload(file: File, onProgress: (n: number) => void): Promise<string> {
    const sign: any = await firstValueFrom(
      this.http.post("/api/media/sign", {}),
    );
    return new Promise((resolve, reject) => {
      const form = new FormData();
      form.append("file", file);
      for (const k of ["signature", "timestamp", "api_key", "folder"])
        form.append(k, sign[k]);
      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        "https://api.cloudinary.com/v1_1/" +
          encodeURIComponent(sign.cloud_name) +
          "/" +
          (file.type.startsWith("video/") ? "video" : "image") +
          "/upload",
      );
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable)
          onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        try {
          const r = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && r.secure_url)
            resolve(r.secure_url);
          else reject(new Error(r.error?.message || "Upload failed"));
        } catch {
          reject(new Error("Invalid upload response"));
        }
      };
      xhr.onerror = () =>
        reject(new Error("Upload failed. Check your connection."));
      xhr.timeout = 600000;
      xhr.ontimeout = () =>
        reject(new Error("Upload timed out. Please retry."));
      xhr.send(form);
    });
  }
}
