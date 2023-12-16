const z = require('zod')

const movieSchema = z.object({
  // también podríamos dejar vacía cada validación -> title: z.string(), etc.
  title: z.string({
    invalid_type_error: 'Movie title must be a string',
    required_error: 'Movie title is required.'
  }),
  year: z.number().int().min(1900).max(2024), // si colocamos min y max ya no es necesario colocar .positive()
  director: z.string(),
  duration: z.number().int().positive(),
  rate: z.number().min(0).max(10).default(5), // default y nullable() -> indican que si no recive esta propiedad
  // es porque es opcional
  poster: z.string().url({
    message: 'Poster must be a valid URL'
  }),
  // para el género como es un array, se la puede hacer de dos formas:
  // Forma 1 -> genre: z.enum(['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Thriller', 'Sci-Fi']).array()
  // Forma 2 ↓
  genre: z.array(z.enum(['Action', 'Adventure', 'Crime', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Thriller', 'Sci-Fi']), {
    required_error: 'Movie genre is required.',
    invalid_type_error: 'Movie genre must be an array of enum Genre'
  })
})

function validateMovie (object) {
  // safeParse-> devuelve un objeto resolve que dice si existe un error o datos
  return movieSchema.safeParse(object) // se puede utilizar también el .parse()
}

function validatePartialMovie (object) {
  // .partial() -> hace opcionales todas o cada una de las propiedades
  // de la película, es decir, si están las propiedades las valida, pero
  // si no están no pasa nada
  return movieSchema.partial().safeParse(object)
}

module.exports = {
  validateMovie,
  validatePartialMovie
}
