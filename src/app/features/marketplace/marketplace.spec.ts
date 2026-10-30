import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  provideHttpClientTesting,
  HttpTestingController,
} from "@angular/common/http/testing";
import { provideRouter, ActivatedRoute } from "@angular/router";
import { registerLocaleData } from "@angular/common";
import localeIn from "@angular/common/locales/en-IN";
import { Catalogue } from "./catalogue";
import { Detail } from "./detail";
import { AuthPage } from "./auth-page";
import { Auth } from "../../core/services/auth";
registerLocaleData(localeIn);
const property = {
  _id: "012345678901234567890123",
  propertyName:
    "A very long property name to exercise wrapping in a narrow card",
  type: "house",
  status: "for-sale",
  price: 2500000,
  location: "Chennai",
  images: [],
};
beforeEach(() => sessionStorage.clear());
afterEach(() => {
  TestBed.inject(HttpTestingController).verify();
  sessionStorage.clear();
});
function configure(component: any, data: any = {}) {
  TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            data,
            queryParamMap: new Map(),
            paramMap: new Map([["id", property._id]]),
          },
        },
      },
    ],
  });
}
it("renders a real API result, including INR pricing and missing-image fallback", () => {
  configure(Catalogue);
  const f = TestBed.createComponent(Catalogue);
  f.detectChanges();
  TestBed.inject(HttpTestingController)
    .expectOne(
      (r) => r.url === "/api/properties" && r.params.get("public") === "true",
    )
    .flush([property]);
  f.detectChanges();
  expect(f.nativeElement.querySelectorAll(".listing-card").length).toBe(1);
  expect(f.nativeElement.textContent).toContain(property.propertyName);
  expect(f.nativeElement.textContent).toContain("25,00,000");
  expect(f.nativeElement.querySelector(".image-placeholder")).toBeTruthy();
});
it("shows an actionable empty result", () => {
  configure(Catalogue);
  const f = TestBed.createComponent(Catalogue);
  f.detectChanges();
  TestBed.inject(HttpTestingController)
    .expectOne((r) => r.url === "/api/properties")
    .flush([]);
  f.detectChanges();
  expect(f.nativeElement.textContent).toContain("No properties found");
});
it("keeps anonymous detail locked and preserves the property return URL", () => {
  configure(Detail);
  const f = TestBed.createComponent(Detail);
  f.detectChanges();
  TestBed.inject(HttpTestingController)
    .expectOne("/api/properties/" + property._id)
    .flush(property);
  f.detectChanges();
  expect(f.nativeElement.querySelector(".locked-panel")).toBeTruthy();
  expect(f.nativeElement.querySelector(".description")).toBeNull();
  expect(
    f.nativeElement.querySelector(".locked-panel a").getAttribute("href"),
  ).toContain("returnUrl");
});
it("unlocks details for a registered session", () => {
  configure(Detail);
  TestBed.inject(Auth).user.set({ role: "user" });
  const f = TestBed.createComponent(Detail);
  f.detectChanges();
  TestBed.inject(HttpTestingController)
    .expectOne("/api/properties/" + property._id)
    .flush({
      ...property,
      description: "A light-filled home",
      videos: [],
      bedrooms: 3,
    });
  f.detectChanges();
  expect(f.nativeElement.textContent).toContain("A light-filled home");
  expect(f.nativeElement.querySelector(".locked-panel")).toBeNull();
});
it("blocks mismatched signup passwords before sending any request", () => {
  configure(AuthPage, { signup: true });
  const f = TestBed.createComponent(AuthPage);
  f.componentInstance.data.password = "password123";
  f.componentInstance.data.confirmPassword = "different";
  f.componentInstance.submit(true);
  expect(f.componentInstance.busy).toBe(false);
  TestBed.inject(HttpTestingController).expectNone("/api/auth/signup");
});

it("retains existing media and publication state when saving a property", async () => {
  const { PropertyFormComponent } =
    await import("../property-form/property-form");
  TestBed.configureTestingModule({
    imports: [PropertyFormComponent],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
    ],
  });
  const f = TestBed.createComponent(PropertyFormComponent);
  f.detectChanges();
  const http = TestBed.inject(HttpTestingController);
  http.expectOne("/api/owners").flush([]);
  f.componentInstance.form.patchValue({
    propertyName: "Home",
    location: "Chennai",
    price: 25000,
    published: true,
  });
  f.componentInstance.media = [
    {
      url: "https://res.cloudinary.com/example/cover.jpg",
      kind: "image",
      name: "Cover",
    },
    {
      url: "https://res.cloudinary.com/example/second.jpg",
      kind: "image",
      name: "Second",
    },
    {
      url: "https://res.cloudinary.com/example/tour.mp4",
      kind: "video",
      name: "Tour",
    },
  ];
  await f.componentInstance.submit();
  const request = http.expectOne("/api/properties");
  expect(request.request.body.images.length).toBe(2);
  expect(request.request.body.videos.length).toBe(1);
  expect(request.request.body.published).toBe(true);
  request.flush(
    { error: "Temporary save failure" },
    { status: 500, statusText: "Error" },
  );
  f.detectChanges();
  expect(f.componentInstance.media.length).toBe(3);
  expect(f.componentInstance.error).toContain("Temporary save failure");
});
