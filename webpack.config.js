const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');


module.exports = withModuleFederationPlugin({
  name: "mf_jurisia_expedientes",
  exposes: {
    "./routes": "./src/app/app.routes.ts", // Asegura que es correcto
  },
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: "auto" }),
  },
});