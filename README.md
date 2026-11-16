# Valley Brothers Trailer Rentals & More, LLC — website

Static site (HTML/CSS/vanilla JS, no build step). Built by Nexora Digital.

- `index.html` — page
- `styles.css` — styles
- `main.js` — scroll-driven scenes (crane load → truck drive, road milestones, aerial haul), reveals, video autoplay, quote form
- `assets/` — logo, compressed client videos, posters

## Deploy (Vercel)
Import the GitHub repo in Vercel → Framework preset **Other** → no build command, output directory `./`. Done.

## Quote form
The form opens a prefilled text message to (775) 857-0312 (no backend needed).
To receive submissions by email instead, point the form at Formspree/Web3Forms and replace the submit handler in `main.js`.
