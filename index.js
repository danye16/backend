// backend/index.js
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client'; // Importa PrismaClient

const app = express();
const prisma = new PrismaClient(); // Instancia de Prisma Client para el backend
const PORT = process.env.PORT || 3001; // Puerto para tu backend

// Middleware
app.use(cors()); // Permite que tu frontend de React (en otro puerto) se conecte
app.use(express.json()); // Permite que el servidor entienda JSON en las solicitudes

// --- Rutas de la API ---

// --- Rutas para Canciones ---

// RUTA CORREGIDA: Esta ruta más específica debe ir ANTES que la ruta con :id
// Ruta para obtener múltiples canciones por sus IDs (útil para el historial)
app.get('/api/canciones/by-ids', async (req, res) => {
  const { ids } = req.query; // IDs vienen como una cadena separada por comas
  if (!ids) {
    return res.json([]);
  }
  const idArray = ids.split(',');
  try {
    const canciones = await prisma.cancion.findMany({
      where: {
        id: {
          in: idArray,
        },
      },
      include: {
        album: {
          include: {
            artista: true,
          },
        },
      },
    });
    res.json(canciones);
  } catch (error) {
    console.error('Error al obtener canciones por IDs:', error);
    res.status(500).json({ error: 'No se pudieron cargar las canciones por IDs' });
  }
});

// Ruta para obtener una canción por ID (útil para el reproductor)
// Esta ruta más general debe ir DESPUÉS de las rutas más específicas que comienzan igual
app.get('/api/canciones/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const cancion = await prisma.cancion.findUnique({
      where: { id },
      include: {
        album: {
          include: {
            artista: true,
          },
        },
      },
    });
    if (cancion) {
      res.json(cancion);
    } else {
      res.status(404).json({ error: 'Canción no encontrada' });
    }
  } catch (error) {
    console.error(`Error al obtener canción con ID ${id}:`, error);
    res.status(500).json({ error: 'No se pudo obtener la canción' });
  }
});

// Ruta para obtener todas las canciones
app.get('/api/canciones', async (req, res) => {
  try {
    const canciones = await prisma.cancion.findMany({
      include: {
        album: {
          include: {
            artista: true,
          },
        },
      },
    });
    res.json(canciones);
  } catch (error) {
    console.error('Error al obtener canciones:', error);
    res.status(500).json({ error: 'No se pudieron obtener las canciones' });
  }
});

// Ruta para crear una nueva canción
app.post('/api/canciones', async (req, res) => {
  const datos = req.body;
  try {
    const nuevaCancion = await prisma.cancion.create({
      data: datos,
    });
    res.status(201).json(nuevaCancion);
  } catch (error) {
    console.error('Error al crear canción:', error);
    res.status(500).json({ error: 'No se pudo crear la canción' });
  }
});

// Ruta para alternar el estado 'esFavorito' de una canción
app.put('/api/canciones/:id/toggle-favorito', async (req, res) => {
  const { id } = req.params;
  const { esFavorito } = req.body; // Recibe el nuevo estado booleano
  try {
    const updatedCancion = await prisma.cancion.update({
      where: { id },
      data: { esFavorito },
    });
    res.json(updatedCancion);
  } catch (error) {
    console.error(`Error al actualizar favorito para canción ${id}:`, error);
    res.status(500).json({ error: 'No se pudo actualizar el estado de favorito' });
  }
});

// Ruta para obtener canciones favoritas
app.get('/api/favoritas', async (req, res) => {
  try {
    const favoritas = await prisma.cancion.findMany({
      where: { esFavorito: true },
      include: { album: { include: { artista: true } } },
    });
    res.json(favoritas);
  } catch (error) {
    console.error('Error al obtener favoritas:', error);
    res.status(500).json({ error: 'No se pudieron obtener las canciones favoritas' });
  }
});


// --- Rutas para Artistas ---
// Ruta para obtener todos los artistas
app.get('/api/artistas', async (req, res) => {
  try {
    const artistas = await prisma.artista.findMany();
    res.json(artistas);
  } catch (error) {
    console.error('Error al obtener artistas:', error);
    res.status(500).json({ error: 'No se pudieron obtener los artistas' });
  }
});

// Ruta para obtener un artista por ID
app.get('/api/artistas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const artista = await prisma.artista.findUnique({ where: { id } });
    if (artista) {
      res.json(artista);
    } else {
      res.status(404).json({ error: 'Artista no encontrado' });
    }
  } catch (error) {
    console.error(`Error al obtener artista con ID ${id}:`, error);
    res.status(500).json({ error: 'No se pudo obtener el artista' });
  }
});

// Ruta para crear un nuevo artista
app.post('/api/artistas', async (req, res) => {
  const datos = req.body;
  try {
    const nuevoArtista = await prisma.artista.create({ data: datos });
    res.status(201).json(nuevoArtista);
  } catch (error) {
    console.error('Error al crear artista:', error);
    res.status(500).json({ error: 'No se pudo crear el artista' });
  }
});

// Ruta para obtener todas las canciones de un artista específico
app.get('/api/artistas/:id/canciones', async (req, res) => {
  const { id } = req.params;
  try {
    // Primero, busca los IDs de los álbumes del artista
    const albumesDelArtista = await prisma.album.findMany({
      where: { artistaId: id },
      select: { id: true }, // Solo necesitamos los IDs de los álbumes
    });
    const albumIds = albumesDelArtista.map(album => album.id);

    if (albumIds.length === 0) {
      return res.json([]);
    }

    // Luego, busca las canciones de esos álbumes, incluyendo el álbum y el artista
    const canciones = await prisma.cancion.findMany({
      where: {
        albumId: { in: albumIds },
      },
      include: {
        album: {
          include: { artista: true }, // ¡CORRECCIÓN AQUÍ! Incluye el álbum y el artista del álbum
        },
      },
    });
    res.json(canciones);
  } catch (error) {
    console.error(`Error al obtener canciones del artista ${id}:`, error);
    res.status(500).json({ error: 'No se pudieron cargar las canciones del artista' });
  }
});


// --- Rutas para Álbumes ---
// Ruta para obtener todos los álbumes
app.get('/api/albumes', async (req, res) => {
  try {
    const albumes = await prisma.album.findMany({
      include: { artista: true },
    });
    res.json(albumes);
  } catch (error) {
    console.error('Error al obtener álbumes:', error);
    res.status(500).json({ error: 'No se pudieron obtener los álbumes' });
  }
});

// Ruta para obtener un álbum por ID
app.get('/api/albumes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const album = await prisma.album.findUnique({
      where: { id },
      include: { artista: true, canciones: true },
    });
    if (album) {
      res.json(album);
    } else {
      res.status(404).json({ error: 'Álbum no encontrado' });
    }
  } catch (error) {
    console.error(`Error al obtener álbum con ID ${id}:`, error);
    res.status(500).json({ error: 'No se pudo obtener el álbum' });
  }
});

// Ruta para crear un nuevo álbum
app.post('/api/albumes', async (req, res) => {
  const datos = req.body;
  try {
    const nuevoAlbum = await prisma.album.create({
      data: {
        ...datos,
        fechaLanzamiento: new Date(datos.fechaLanzamiento), // Asegura que la fecha sea un objeto Date
      },
    });
    res.status(201).json(nuevoAlbum);
  } catch (error) {
    console.error('Error al crear álbum:', error);
    res.status(500).json({ error: 'No se pudo crear el álbum' });
  }
});

// Ruta para obtener todas las canciones de un álbum específico
app.get('/api/albumes/:id/canciones', async (req, res) => {
  const { id } = req.params;
  try {
    // Busca las canciones que pertenecen a este álbum, incluyendo el álbum y el artista
    const canciones = await prisma.cancion.findMany({
      where: { albumId: id },
      include: {
        album: {
          include: { artista: true }, // ¡CORRECCIÓN AQUÍ! Incluye el álbum y el artista del álbum
        },
      },
    });
    res.json(canciones);
  } catch (error) {
    console.error(`Error al obtener canciones del álbum ${id}:`, error);
    res.status(500).json({ error: 'No se pudieron cargar las canciones del álbum' });
  }
});


// --- Rutas para Géneros ---
// Ruta para obtener todos los géneros
app.get('/api/generos', async (req, res) => {
  try {
    const generos = await prisma.genero.findMany();
    res.json(generos);
  } catch (error) {
    console.error('Error al obtener géneros:', error);
    res.status(500).json({ error: 'No se pudieron obtener los géneros' });
  }
});

// Ruta para obtener un género por ID
app.get('/api/generos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const genero = await prisma.genero.findUnique({ where: { id: parseInt(id) } }); // ID de género es Int
    if (genero) {
      res.json(genero);
    } else {
      res.status(404).json({ error: 'Género no encontrado' });
    }
  } catch (error) {
    console.error(`Error al obtener género con ID ${id}:`, error);
    res.status(500).json({ error: 'No se pudo obtener el género' });
  }
});

// Ruta para crear un nuevo género
app.post('/api/generos', async (req, res) => {
  const datos = req.body;
  try {
    const nuevoGenero = await prisma.genero.create({ data: datos });
    res.status(201).json(nuevoGenero);
  } catch (error) {
    console.error('Error al crear género:', error);
    res.status(500).json({ error: 'No se pudo crear el género' });
  }
});

// Ruta para obtener todas las canciones asociadas a un género específico
app.get('/api/generos/:id/canciones', async (req, res) => {
  const { id } = req.params;
  try {
    const generoId = parseInt(id);
    const albumesEnGeneros = await prisma.albumesEnGeneros.findMany({
      where: { generoId },
      select: { albumId: true },
    });
    const albumIds = albumesEnGeneros.map(aeg => aeg.albumId);

    if (albumIds.length === 0) {
      return res.json([]);
    }

    const canciones = await prisma.cancion.findMany({
      where: {
        albumId: { in: albumIds },
      },
      include: {
        album: {
          include: { artista: true },
        },
      },
    });
    res.json(canciones);
  } catch (error) {
    console.error(`Error al obtener canciones del género ${id}:`, error);
    res.status(500).json({ error: 'No se pudieron cargar las canciones del género' });
  }
});


// --- Ruta para Búsqueda General (ya existía, pero se mantiene) ---
// Ruta para la búsqueda general (canciones, artistas, álbumes)
app.get('/api/search', async (req, res) => {
  const { query } = req.query; // Obtiene el término de búsqueda de la URL (?query=...)
  if (!query) {
    return res.status(400).json({ error: 'Se requiere un término de búsqueda' });
  }
  try {
    const lowerCaseQuery = query.toLowerCase();

    const [artistas, albumes, canciones] = await Promise.all([
      prisma.artista.findMany({
        where: { nombre: { contains: lowerCaseQuery, mode: 'insensitive' } },
      }),
      prisma.album.findMany({
        where: { titulo: { contains: lowerCaseQuery, mode: 'insensitive' } },
        include: { artista: true },
      }),
      prisma.cancion.findMany({
        where: { titulo: { contains: lowerCaseQuery, mode: 'insensitive' } },
        include: { album: { include: { artista: true } } },
      }),
    ]);

    res.json({ artistas, albumes, canciones });
  } catch (error) {
    console.error('Error en la búsqueda general:', error);
    res.status(500).json({ error: 'Error al realizar la búsqueda' });
  }
});


// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});

// Desconectar Prisma al cerrar la aplicación (opcional pero buena práctica)
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
