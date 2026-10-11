const appConfig: IAppConfig = {
  /**
   * server port
   */
  PORT: Number(process.env.PORT) || 3001,

  /**
   * ngilangin properti sourceUrl di response
   */
  sourceUrl: true,
};

export default appConfig;