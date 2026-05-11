/**
 * Jest Setup File
 * Configuración global para todas las pruebas
 */

// Aumentar timeout para operaciones de BD
jest.setTimeout(10000);

// Mock console para pruebas limpias (opcional, comentar si necesitas logs)
// beforeAll(() => {
//   jest.spyOn(console, 'log').mockImplementation(() => {});
//   jest.spyOn(console, 'error').mockImplementation(() => {});
// });

// afterAll(() => {
//   console.log.mockRestore();
//   console.error.mockRestore();
// });
