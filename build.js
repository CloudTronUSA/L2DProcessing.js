import esbuild from 'esbuild';

esbuild.build({
    entryPoints: ['./prebuild.js'], // Use the wrapper as the entry point
    bundle: true,
    outfile: 'processing.js', // Output file location
    platform: 'node', // Target platform
    format: 'iife', // IIFE format for direct browser compatibility
    target: ['es6'], // Target JS version for compatibility
    minify: false, // Optional: Minify the output for production
    define: {
      'process.env.NODE_ENV': '"production"', // Optional: Set environment
    },
  }).catch(() => process.exit(1));