package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"image"
)

//go:embed content/models/*.obj content/models/*.mtl content/products.json content/images/*.png
var shopFiles embed.FS

type product struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Tagline     string   `json:"tagline"`
	Description string   `json:"description"`
	Images      []string `json:"images"` // files in content/images, shown in the detail view
	model       *model
	imgs        []productImage
}

// productImage is a photo: its PNG bytes, a Kitty image id, and (lazily) the
// decoded pixels for terminals without Kitty graphics.
type productImage struct {
	id   int
	name string
	data []byte
	img  image.Image
}

// A detail view is one way of looking at a product.
type view struct {
	kind  string // "shaded", "wire" or "photo"
	label string
	photo int // index into product.imgs for kind "photo"
}

func (p product) views() []view {
	vs := []view{{kind: "shaded", label: "Shaded"}, {kind: "wire", label: "Wireframe"}}
	for i := range p.imgs {
		label := "Photo"
		if len(p.imgs) > 1 {
			label = fmt.Sprintf("Photo %d", i+1)
		}
		vs = append(vs, view{kind: "photo", label: label, photo: i})
	}
	return vs
}

// loadProducts mirrors src/shop/products.ts: metadata plus an .obj/.mtl per id.
func loadProducts() ([]product, error) {
	raw, err := shopFiles.ReadFile("content/products.json")
	if err != nil {
		return nil, err
	}
	return parseProducts(raw)
}

// parseProducts builds products from a products.json document, reading each
// model and image from the embedded content directory.
func parseProducts(raw []byte) ([]product, error) {
	var ps []product
	if err := json.Unmarshal(raw, &ps); err != nil {
		return nil, err
	}
	nextID := 100 // Kitty image ids; 100+ stay clear of the 16 base colors
	for i := range ps {
		for _, name := range ps[i].Images {
			data, err := shopFiles.ReadFile("content/images/" + name)
			if err != nil {
				return nil, err
			}
			ps[i].imgs = append(ps[i].imgs, productImage{id: nextID, name: name, data: data})
			nextID++
		}
		obj, err := shopFiles.ReadFile("content/models/" + ps[i].ID + ".obj")
		if err != nil {
			return nil, err
		}
		mtl, err := shopFiles.ReadFile("content/models/" + ps[i].ID + ".mtl")
		if err != nil {
			return nil, err
		}
		ps[i].model = parseObj(string(obj), string(mtl))
	}
	return ps, nil
}
