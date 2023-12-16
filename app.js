const express = require('express')
const crypto = require('node:crypto')

const cors = require('cors')

const movies = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const app = express()
app.use(express.json())
app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://localhost:8080',
      'http://localhost:1234',
      'https://movies.com',
      'https://midu.dev'
    ]
    if (ACCEPTED_ORIGINS.includes(origin)) {
      return callback(null, true)
    }
    if (!origin) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS'))
  }
}))

app.disable('x-powered-by')

// -------------------------------------START------------------------------------------------

// Obtener película por género o todas
app.get('/movies', (req, res) => {
  const { genre } = req.query // recuperamos todos los query params
  if (genre) {
    const filteredMovies = movies.filter(movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase()))
    return res.json(filteredMovies)
  }
  res.json(movies)
})

// --------------------------------BREAK-----------------------------------------------------
// --------------------------------START-----------------------------------------------------

// Obtener película por id
app.get('/movies/:id', (req, res) => {
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  if (movie) return res.json(movie)
  res.status(404).json({ message: 'Movie not found' })
})

// ---------------------------------BREAK----------------------------------------------------
// ---------------------------------START----------------------------------------------------

// Crear una película

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const newMovie = ({
    id: crypto.randomUUID(), // genera un uuid v4,
    ...result.data
  })

  movies.push(newMovie)
  res.status(201).json(newMovie)
})

// ----------------------------------BREAK---------------------------------------------------
// ----------------------------------START---------------------------------------------------

// ELIMINAR UNA PELÍCULA
app.delete('/movies/:id', (req, res) => {
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

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
  console.log(`server is listening on port http://localhost:${PORT}`)
})
