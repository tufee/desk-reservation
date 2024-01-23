import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth/auth.service';
import { AuthGuard } from './auth.guard';
import { TokenPayloadDto } from './dto/token-payload.dto';

describe('AuthGuard', () => {
  let authGuardMock: AuthGuard;
  let authServiceMock: AuthService;

  function createMockExecutionContextWithToken(
    token: string | null,
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: token ? `Bearer ${token}` : '',
          },
        }),
      }),
    } as ExecutionContext;
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: AuthService,
          useValue: {
            verifyToken: jest.fn(),
          },
        },
      ],
    }).compile();

    authGuardMock = module.get<AuthGuard>(AuthGuard);
    authServiceMock = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authGuardMock).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access for a valid token', async () => {
      const token: TokenPayloadDto = {
        id: '2159de48-3528-4699-9b17-16e16d81f9cb',
        name: 'john',
        iat: 1705542956,
        exp: 1705544756,
      };
      const context = createMockExecutionContextWithToken('valid-token');
      jest.spyOn(authServiceMock, 'verifyToken').mockResolvedValue(token);

      await expect(authGuardMock.canActivate(context)).resolves.toBeTruthy();
    });

    it('should throw UnauthorizedException when token is missing', async () => {
      const context = createMockExecutionContextWithToken(null);

      await expect(authGuardMock.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for an invalid token', async () => {
      const context = createMockExecutionContextWithToken('invalid-token');
      jest.spyOn(authServiceMock, 'verifyToken').mockImplementation(() => {
        throw new Error();
      });

      await expect(authGuardMock.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('extractTokenFromHeader', () => {
    function createMockRequest(type?: string, token?: string): Request {
      return {
        headers: {
          authorization: type && token ? `${type} ${token}` : type,
        },
      } as unknown as Request;
    }

    it('should extract token when Bearer token is provided', () => {
      const request = createMockRequest('Bearer', 'token') as Request as any;
      expect(authGuardMock.extractTokenFromHeader(request)).toBe('token');
    });

    it('should return undefined when no authorization header is present', () => {
      const request = createMockRequest() as Request as any;
      expect(authGuardMock.extractTokenFromHeader(request)).toBeUndefined();
    });

    it('should return undefined for non-Bearer tokens', () => {
      const request = createMockRequest('Basic', 'token') as Request as any;
      expect(authGuardMock.extractTokenFromHeader(request)).toBeUndefined();
    });

    it('should return undefined for malformed authorization header', () => {
      const request = createMockRequest('Bearer') as Request as any;
      expect(authGuardMock.extractTokenFromHeader(request)).toBeUndefined();
    });
  });
});
