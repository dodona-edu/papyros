module.exports = {
    purge: [
      './build/**/*.html',
      './src/**/*.ts',
    ],
    variants: {
      extend: {
       backgroundColor: ['active'],
      }
    }
  };
