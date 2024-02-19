import axios, { AxiosInstance } from 'axios';

import * as webConfigService from './webConfigService';

/**
 * Environment Driver HTTP client.
 */
class EnvironmentDriverClient {
  private httpClient: AxiosInstance;

  constructor() {
    this.httpClient = this.createHttpClient();
  }

  /**
   * Creates Axios instance.
   *
   * @returns Axios instance
   */
  private createHttpClient = (): AxiosInstance =>
    axios.create({
      baseURL: webConfigService.getEnvironmentDriverUrl(),
    });

  // PUBLIC

  /**
   * @returns Axios instance
   */
  public getHttpClient = (): AxiosInstance => this.httpClient;
}

export const environmentDriverClient = new EnvironmentDriverClient();