import { httpsCallable, type HttpsCallableOptions } from 'firebase/functions';
import { functions, isFirebaseConfigured } from './config';

/**
 * Throw a descriptive error if Cloud Functions is invoked without configuration.
 */
function assertFunctionsReady() {
  if (!isFirebaseConfigured || !functions) {
    throw new Error(
      'Cloud Functions is not configured. Please supply valid VITE_FIREBASE_* credentials in your .env file.'
    );
  }
  return functions;
}

/**
 * Call a 2nd Generation Cloud Function using HTTPS callable.
 *
 * @param functionName Name of the deployed 2nd Gen callable function
 * @param data Request payload
 * @param options Optional timeout or settings
 */
export async function callCloudFunction<TRequest = unknown, TResponse = unknown>(
  functionName: string,
  data?: TRequest,
  options?: HttpsCallableOptions
): Promise<TResponse> {
  const functionsInstance = assertFunctionsReady();
  const callable = httpsCallable<TRequest, TResponse>(functionsInstance, functionName, options);
  const result = await callable(data);
  return result.data;
}
