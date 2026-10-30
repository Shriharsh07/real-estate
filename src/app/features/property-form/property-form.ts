import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { MediaService, MediaItem } from "../../core/services/media";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { combineLatest } from "rxjs";
import { Router, RouterLink, ActivatedRoute } from "@angular/router";
import { PropertyService } from "../../core/services/property";
import { OwnerService } from "../../core/services/owner";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-property-form",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: "./property-form.html",
  styleUrl: "./property-form.scss",
})
export class PropertyFormComponent implements OnInit, OnDestroy {
  form: any;
  media: MediaItem[] = [];
  optimization = "";
  progress = 0;

  isUploading = false;
  owners: any[] = [];
  isEditMode = false;
  propertyId: string | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private propertyService: PropertyService,
    private router: Router,
    private route: ActivatedRoute,
    private ownerService: OwnerService,
    private mediaService: MediaService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      propertyName: ["", Validators.required],
      description: [""],
      location: ["", Validators.required],
      pincode: [
        "",
        [
          Validators.minLength(6),
          Validators.maxLength(6),
          Validators.pattern(/^[0-9]{6}$/),
        ],
      ],
      type: ["house"],
      status: ["for-sale"],
      vegPreference: ["any"],
      price: [null, [Validators.required, Validators.min(0)]],
      images: [[]],
      videos: [[]],
      published: [false],
      length: [null],
      width: [null],
      bedrooms: [null],
      bathrooms: [null],
      totalSqft: [null],
      owner: [null],
    });

    // Load owners for dropdown
    this.loadOwners();

    // Check if we're in edit mode
    this.route.paramMap.subscribe((params) => {
      const id = params.get("id");
      if (id) {
        this.isEditMode = true;
        this.propertyId = id;
        this.loadProperty(id);
      }
    });

    // Auto-calculate totalSqft from length × width
    combineLatest([
      this.form.get("length")!.valueChanges,
      this.form.get("width")!.valueChanges,
    ]).subscribe((values: number[]) => {
      const [length, width] = values;
      const sqft = length && width ? length * width : null;
      this.form.get("totalSqft")!.setValue(sqft, { emitEvent: false });
    });

    // Reset vegPreference when type changes away from residential
    this.form.get("type")!.valueChanges.subscribe((type: string) => {
      if (!["house", "apartment", "duplex"].includes(type)) {
        this.form.get("vegPreference")!.setValue(null, { emitEvent: false });
      } else if (!this.form.get("vegPreference")!.value) {
        this.form.get("vegPreference")!.setValue("any", { emitEvent: false });
      }
    });
  }

  get showVegField(): boolean {
    return ["house", "apartment", "duplex"].includes(
      this.form?.get("type")?.value,
    );
  }

  async onFileSelect(event: any) {
    const files: File[] = Array.from(event.target.files || []);
    event.target.value = "";
    this.error = null;
    const images =
      this.media.filter((m) => m.kind === "image").length +
      files.filter((f) => f.type.startsWith("image/")).length;
    const videos =
      this.media.filter((m) => m.kind === "video").length +
      files.filter((f) => f.type.startsWith("video/")).length;
    if (images > 15 || videos > 2) {
      this.error = "Maximum 15 images and 2 videos per property.";
      return;
    }
    for (const f of files) {
      if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
        this.error = "Choose an image or video.";
        return;
      }
      if (f.size > (f.type.startsWith("video/") ? 100 : 10) * 1024 * 1024) {
        this.error = "Maximum input size: 10 MB per image, 100 MB per video.";
        return;
      }
    }
    this.isUploading = true;
    try {
      for (const original of files) {
        const file = await this.mediaService.optimize(original, (s) => {
          this.optimization = s;
          this.cdr.markForCheck();
        });
        this.media.push({
          file,
          url: URL.createObjectURL(file),
          kind: file.type.startsWith("video/") ? "video" : "image",
          name: file.name,
        });
      }
      this.optimization = "Media optimized and ready to upload.";
    } catch (e: any) {
      this.error = e.message || "Media optimization failed.";
    } finally {
      this.isUploading = false;
      this.cdr.markForCheck();
    }
  }
  removeMedia(i: number) {
    const [m] = this.media.splice(i, 1);
    if (m.file) URL.revokeObjectURL(m.url);
  }
  moveMedia(i: number, d: number) {
    if (i + d < 0 || i + d >= this.media.length) return;
    [this.media[i], this.media[i + d]] = [this.media[i + d], this.media[i]];
  }
  cover(i: number) {
    const [m] = this.media.splice(i, 1);
    this.media.unshift(m);
  }
  ngOnDestroy() {
    for (const m of this.media) if (m.file) URL.revokeObjectURL(m.url);
  }
  async submit() {
    if (this.loading || this.isUploading) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error =
        "Please enter a property name, location, valid price, and valid pincode.";
      return;
    }
    this.loading = true;
    this.error = null;
    try {
      for (const m of this.media) {
        if (!m.file) continue;
        this.isUploading = true;
        this.optimization = "Uploading " + m.name;
        this.progress = 0;
        const url = await this.mediaService.upload(m.file, (n) => {
          this.progress = n;
          this.cdr.markForCheck();
        });
        URL.revokeObjectURL(m.url);
        m.url = url;
        delete m.file;
      }
      this.isUploading = false;
      const data = {
        ...this.form.value,
        images: this.media.filter((m) => m.kind === "image").map((m) => m.url),
        videos: this.media.filter((m) => m.kind === "video").map((m) => m.url),
      };
      const req =
        this.isEditMode && this.propertyId
          ? this.propertyService.updateProperty(this.propertyId, data)
          : this.propertyService.createProperty(data);
      req.subscribe({
        next: () => this.router.navigate(["/property-list"]),
        error: (e) => {
          this.error =
            e.error?.error ||
            "Failed to save property. Uploaded media is retained for retry.";
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
    } catch (e: any) {
      this.error = e.message || "Upload failed. Please retry.";
      this.isUploading = false;
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  loadOwners() {
    this.ownerService.getOwners().subscribe({
      next: (res: any) => {
        this.owners = Array.isArray(res) ? res : [res];
      },
      error: (err) => {
        console.error("Error loading owners:", err);
      },
    });
  }

  loadProperty(id: string) {
    this.loading = true;
    this.propertyService.getProperty(id).subscribe({
      next: (res: any) => {
        this.form.patchValue({
          published: res.published === true,
          propertyName: res.propertyName,
          description: res.description,
          location: res.location,
          pincode: res.pincode,
          type: res.type,
          status: res.status,
          vegPreference: res.vegPreference,
          price: res.price,
          length: res.length,
          width: res.width,
          bedrooms: res.bedrooms,
          bathrooms: res.bathrooms,
          totalSqft: res.totalSqft,
          owner: res.owner?._id || res.owner,
        });

        this.media = [
          ...(res.images || []).map((url: string) => ({
            url,
            kind: "image" as const,
            name: "Property photo",
          })),
          ...(res.videos || []).map((url: string) => ({
            url,
            kind: "video" as const,
            name: "Property video",
          })),
        ];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = "Failed to load property";
        this.loading = false;
      },
    });
  }
}
