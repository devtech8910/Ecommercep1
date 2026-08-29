# Original User Request

## 2026-08-24T16:09:45Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: The full multi-agent team

Fix a UI bug in the e-commerce storefront where product images are only half visible, leaving large empty spaces within their containers. The images need to be styled correctly (e.g., proper aspect ratio, object-fit) to display fully and beautifully on all screen sizes, both on product listing cards and the main product details page.

Working directory: c:\Users\Purna\OneDrive\Desktop\Ecom
Integrity mode: development

## Requirements

### R1. Fix Product Card Images
Update the CSS for product cards on listing pages (Shop, Men's, Women's, Kids, etc.) so that product images are fully visible, maintain their natural aspect ratio, and eliminate the large empty gaps between the image and the product details.

### R2. Fix Product Details Page Images
Update the CSS on the main Product Details page so that the primary product image and any gallery thumbnails are fully visible, properly contained within their layout grid, and scale appropriately without being stretched or distorted.

## Acceptance Criteria

### Visual Layout (Verified via Agent-as-Judge)
- [ ] **Product Cards:** An independent agent reviews the product cards and confirms the image fills the intended area correctly (e.g., using `object-fit: cover` or `contain` appropriately) without leaving large empty black spaces.
- [ ] **Product Details:** An independent agent reviews the product details page and confirms the main image is fully visible and not inappropriately cut off.
- [ ] **Responsiveness:** An independent agent confirms that the images scale correctly without breaking the layout on both mobile (e.g., 375px width) and desktop screen sizes.
