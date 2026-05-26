package handlers

import (
	"context"
	"io"
	"net/http"

	"real-estate-api/config"

	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

func UploadImages(w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(32 << 20)
	if err != nil {
		WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	files := r.MultipartForm.File["images"]
	if len(files) == 0 {
		WriteError(w, http.StatusBadRequest, "No files uploaded")
		return
	}

	if len(files) > 5 {
		WriteError(w, http.StatusBadRequest, "Maximum 5 images allowed")
		return
	}

	var imageUrls []string

	for _, fileHeader := range files {
		file, err := fileHeader.Open()
		if err != nil {
			WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		defer file.Close()

		bytes, err := io.ReadAll(file)
		if err != nil {
			WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}

		uploadParams := uploader.UploadParams{
			Folder: "properties",
		}

		uploadResult, err := config.CloudinaryClient.Upload.Upload(context.Background(), bytes, uploadParams)
		if err != nil {
			WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}

		imageUrls = append(imageUrls, uploadResult.SecureURL)
	}

	WriteJSON(w, http.StatusOK, imageUrls)
}
