import { defineConfig } from 'vite';

// Configuración mínima: el dev sigue en 127.0.0.1 (lo fija el guion de package.json) y el
// build usa los valores por defecto de Vite. Lo único que se ajusta aquí es el `preview`,
// que de fábrica rechaza cualquier Host que no sea localhost y por eso devuelve 403 cuando
// el paseo se sirve detrás de un túnel o un proxy. El contenido servido es estático y sin
// credenciales, así que se aceptan todos los hosts del preview.
export default defineConfig({
  preview: {
    allowedHosts: true,
  },
});
