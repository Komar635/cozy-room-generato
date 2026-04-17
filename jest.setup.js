// Setup file for Bun test runner
// This file is loaded before running tests

import '@testing-library/jest-dom';

// Мок для Canvas и WebGL
if (typeof HTMLCanvasElement !== 'undefined') {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: () => ({
      getExtension: () => null,
      getParameter: () => 4096,
      createShader: () => ({}),
      shaderSource: () => {},
      compileShader: () => {},
      createProgram: () => ({}),
      attachShader: () => {},
      linkProgram: () => {},
      useProgram: () => {},
      createBuffer: () => ({}),
      bindBuffer: () => {},
      bufferData: () => {},
      enableVertexAttribArray: () => {},
      vertexAttribPointer: () => {},
      drawArrays: () => {},
      viewport: () => {},
      clearColor: () => {},
      clear: () => {},
    }),
  });
}

// Мок для ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Мок для requestAnimationFrame
global.requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Мок для URL.createObjectURL
if (typeof global.URL !== 'undefined') {
  global.URL.createObjectURL = () => 'mock-url';
}
