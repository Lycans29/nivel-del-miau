// tailwind.config.js
module.exports = {
  content: [
    "./*.html",         // si tus archivos están en la raíz
    "./src/**/*.html",  // si los tienes en src
    "./js/**/*.js"      // si usas clases en JS
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
