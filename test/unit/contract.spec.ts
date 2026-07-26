import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ERROR_CODES,
  isApiErrorResponse,
} from '../../shared/api-response';
import {
  API_VERSION,
  API_V1_PREFIX,
  OPENAPI_V1_PREFIX,
} from '../../shared/api-version';

type OpenApiDocument = {
  info: { version: string };
  paths: Record<string, {
    get?: { parameters?: Array<{ name: string; in: string; required?: boolean }> };
    post?: { parameters?: Array<{ name: string; in: string; required?: boolean }> };
  }>;
  components: {
    schemas: {
      ErrorResponse: {
        properties: {
          error: {
            properties: {
              code: { enum: string[] };
            };
          };
        };
      };
    };
  };
};

function loadOpenApi(): OpenApiDocument {
  const file = join(process.cwd(), 'docs', 'openapi.json');
  return JSON.parse(readFileSync(file, 'utf8')) as OpenApiDocument;
}

describe('public API contract', () => {
  it('uses one v1 prefix for browser and public endpoints', () => {
    expect(API_VERSION).toBe('v1');
    expect(API_V1_PREFIX).toBe('/api/v1');
    expect(OPENAPI_V1_PREFIX).toBe('/openapi/v1');
  });

  it('documents the required idempotency header for tool execution', () => {
    const document = loadOpenApi();
    const parameters = document.paths['/openapi/v1/tools/execute'].post?.parameters;
    expect(parameters).toContainEqual(expect.objectContaining({
      name: 'Idempotency-Key',
      in: 'header',
      required: true,
    }));
  });

  it('keeps documented and runtime error code enumerations aligned', () => {
    const document = loadOpenApi();
    const documentedCodes = document.components.schemas.ErrorResponse
      .properties.error.properties.code.enum;
    expect(documentedCodes).toEqual([...ERROR_CODES]);
    expect(isApiErrorResponse({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input' },
    })).toBe(true);
    expect(isApiErrorResponse({
      error: { code: 'SUCCESS', message: 'Not an error' },
    })).toBe(false);
  });
});
