const express = require('express') // require -> commonJS
const crypto = require('node:crypto')
const movies = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const app = express()
app.use(express.json())

app.disable('x-powered-by') // deshabilita el header X-Powered-By: Express

// métodos normales -> GET/HEAD/POST
// métodos complejos -> PUT/PATCH/DELETE

// CORS PRE-Flight
// Petición OPTIONS -> se require cuando ejecutemos cualquiera de los métodos complejos

/*  todos los recursos que sean MOVIES se identifican con /movies */

// -------------------------------------START------------------------------------------------

const ACCEPTED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:1234',
  'https://movies.com',
  'https://midu.dev',
  'http://127.0.0.1:5500' // -> esta es del live server
]

// Obtener película por género o todas
app.get('/movies', (req, res) => {
  // ---------------------------FORMAS DE ARREGLAR EL ERROR DE CORS-----------------------------------------
  // res.header('Access-Control-Allow-Origin', '*') // -> permite que todo mundo pueda cargar la información
  // res.header('Access-Control-Allow-Origin', 'http://localhost:8080') // -> solo este dominio puede acceder
  const origin = req.header('origin') // -> esta forma valida de una lista de dominios aceptados
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
  }

  // -------------------------------------------------------------------------------------------------------
  const { genre } = req.query // recuperamos todos los query params
  if (genre) {
    // const filteredMovies = movies.filter(movie => movie.genre.includes(genre))

    // Transformamos lo generos que tiene la película a minúsculas junto con el genero que pasa
    // el usuario en el endpoint, los comparamos y si coinciden devolvemos todas las películas
    // que tienen dicho como género, esto para asegurarnos de que no existan problemas de case-sensitive
    const filteredMovies = movies.filter(movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase()))
    return res.json(filteredMovies)
  }
  res.json(movies) // esto permite que si no le pasamos un género, me muestre todas las películas
})

// --------------------------------BREAK-----------------------------------------------------
// --------------------------------START-----------------------------------------------------

// Express permite colocar expresiones o regex como rutas.
// path-to-regexp -> es una biblioteca que convierte urls en expresiones regulares.

// Obtener película por id
app.get('/movies/:id', (req, res) => {
  // /movies/:id/:id2/:id3 -> así se puede colocar varios parámetros en un endpoint
  // y llamarlos como así -> const { id, id2, id3 } = req.params

  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  if (movie) return res.json(movie)
  res.status(404).json({ message: 'Movie not found' })
})

// ---------------------------------BREAK----------------------------------------------------
// ---------------------------------START----------------------------------------------------

// Crear una película

app.post('/movies', (req, res) => {
  // validando los datos del req.body mediante
  // la creación de un esquema con zod
  const result = validateMovie(req.body)

  if (!result.success) {
    // 422 -> Unprocessable Entity
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const newMovie = ({
    id: crypto.randomUUID(), // genera un uuid v4,
    // ...req.body -> esto nunca se debería hacer ya que aquí no se validan los datos
    ...result.data // -> aquí sí que se validan los datos
  })

  // -----------------------------------------------------------
  // con la validación de zod nos evitamos hacer esto
  //       -> const {title, genre, etc } = req.body
  // y pasarselo al objeto newMovie
  // además evitamos validar de forma manual los tipos de datos
  // ----------------------------------------------------------

  // Esto no sería REST, porque estamos guardando el estado de
  // la aplicación en memoria
  movies.push(newMovie)
  res.status(201).json(newMovie)
})

// ----------------------------------BREAK---------------------------------------------------
// ----------------------------------START---------------------------------------------------

// ELIMINAR UNA PELÍCULA
app.delete('/movies/:id', (req, res) => {
  const origin = req.header('origin') // -> esta forma valida de una lista de dominios aceptados
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }
  movies.splice(movieIndex, 1) // elimina la película del array de movies
  return res.json({ message: 'Movie deleted' })
})

// ----------------------------------BREAK---------------------------------------------------
// ----------------------------------START---------------------------------------------------

// Actualizar sólo una parte de la película
app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)
  if (!result.success) {
    res.status(400).json({ error: JSON.parse(result.error.message) })
  }
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) return res.status(400).json({ message: 'Movie not found' })

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }
  movies[movieIndex] = updateMovie
  res.json(updateMovie)
})
// ----------------------------------BREAK---------------------------------------------------

// CORREGIR EL PROBLEMA DE CORS PARA PETICIONES CON MÉTODOS COMPLEJOS

app.options('/movies/:id', (req, res) => {
  const origin = req.header('origin') // -> esta forma valida de una lista de dominios aceptados
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE') // métodos permitidos
  }
  res.sendStatus(200)
  // res.send(200)
  // res.status(200)
})

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
  console.log(`server is listening on port http://localhost:${PORT}`)
})
