# Redesign: Hero Section Troubleshooting & Refinement

I've critically evaluated the persistent mask alignment issues. The root cause is a "split-brain" problem where the paths used for the background blobs and the paths used for the clipping mask are separate elements that can fall out of sync due to transformations or animation timing.

## The Problem
- **Coordinate Drift**: Applying `transform="translate(...)"` to paths inside a `mask` vs visible paths can lead to different coordinate origins, especially when nested masks are involved.
- **Animation Drift**: Using separate classes/elements for the mask vs the background means the browser has to track multiple identical animations, which can occasionally desync or be calculated in different spaces.
- **Blending Overlap**: The "grey area" is simply the overlap of the two translucent background blobs being visible behind a slightly misaligned image mask.

## The Solution: `<use>` and `<clipPath>`
I am moving to a single-source-of-truth model:
1. **Define Once**: All paths and animations will be defined once in the `<defs>` section.
2. **Clone Everywhere**: We will use the `<use>` element to reference these paths for both the visible background and the masking logic.
3. **Simplified Intersection**: I'll use a `clipPath` directly on the `<foreignObject>` or its child to handle the intersection, rather than nested masks.

## Implementation Steps
1. Create a clean `<defs>` section with ID-based paths.
2. Apply animations directly to these definition paths.
3. Use `<use>` for the pink and green background blobs.
4. Use a combination of `mask` and `use` that references the exact same IDs for the image intersection.
