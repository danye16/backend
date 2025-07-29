-- CreateTable
CREATE TABLE "artistas" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "portada" TEXT,

    CONSTRAINT "artistas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "albumes" (
    "id" TEXT NOT NULL,
    "titulo" VARCHAR(100) NOT NULL,
    "fechaLanzamiento" TIMESTAMP(3) NOT NULL,
    "portada" VARCHAR(255),
    "artistaId" TEXT NOT NULL,

    CONSTRAINT "albumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canciones" (
    "id" TEXT NOT NULL,
    "titulo" VARCHAR(100) NOT NULL,
    "duracion" INTEGER NOT NULL,
    "esFavorito" BOOLEAN NOT NULL DEFAULT false,
    "albumId" TEXT NOT NULL,

    CONSTRAINT "canciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,

    CONSTRAINT "generos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "albumes_en_generos" (
    "albumId" TEXT NOT NULL,
    "generoId" INTEGER NOT NULL,

    CONSTRAINT "albumes_en_generos_pkey" PRIMARY KEY ("albumId","generoId")
);

-- CreateIndex
CREATE UNIQUE INDEX "generos_nombre_key" ON "generos"("nombre");

-- AddForeignKey
ALTER TABLE "albumes" ADD CONSTRAINT "albumes_artistaId_fkey" FOREIGN KEY ("artistaId") REFERENCES "artistas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canciones" ADD CONSTRAINT "canciones_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "albumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "albumes_en_generos" ADD CONSTRAINT "albumes_en_generos_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "albumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "albumes_en_generos" ADD CONSTRAINT "albumes_en_generos_generoId_fkey" FOREIGN KEY ("generoId") REFERENCES "generos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
