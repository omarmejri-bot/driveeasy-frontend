export const environment = {
  production: false,
  /** Point d'entrée unique : API Gateway (le frontend ne contacte jamais directement les microservices) */
  apiUrl: 'http://localhost:8080/api'
};
