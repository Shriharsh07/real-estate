package handlers

import (
	"bytes"
	"context"
	"image"
	"image/jpeg"
	"io"
	"net/http"

	"real-estate-api/config"

	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	_ "golang.org/x/image/webp"
)

func compressImage(img image.Image, quality int) ([]byte, error) {
	var buf bytes.Buffer
	err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: quality})
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func UploadImages(w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(32 << 20)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	files := r.MultipartForm.File["images"]
	if len(files) == 0 {
		writeError(w, http.StatusBadRequest, "No files uploaded")
		return
	}

	if len(files) > 5 {
		writeError(w, http.StatusBadRequest, "Maximum 5 images allowed")
		return
	}

	var imageUrls []string

	for _, fileHeader := range files {
		file, err := fileHeader.Open()
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		defer file.Close()

		data, err := io.ReadAll(file)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		// Decode image
		img, _, err := image.Decode(bytes.NewReader(data))
		if err != nil {
			writeError(w, http.StatusBadRequest, "Invalid image format")
			return
		}

		// Compress image to JPEG with 80% quality
		compressedBytes, err := compressImage(img, 80)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		// If compressed size is still larger than 2MB, compress more aggressively
		if len(compressedBytes) > 2*1024*1024 {
			compressedBytes, err = compressImage(img, 60)
			if err != nil {
				writeError(w, http.StatusInternalServerError, err.Error())
				return
			}
		}

		uploadParams := uploader.UploadParams{
			Folder: "properties",
		}

		uploadResult, err := config.CloudinaryClient.Upload.Upload(context.Background(), compressedBytes, uploadParams)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		imageUrls = append(imageUrls, uploadResult.SecureURL)
	}

	writeJSON(w, http.StatusOK, imageUrls)
}
