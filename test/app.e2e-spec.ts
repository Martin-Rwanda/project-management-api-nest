import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptor';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let userId: string;
  let organizationId: string;
  let projectId: string;
  let taskId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new LoggingInterceptor());

    await app.init();

    // Clean up database before tests
    dataSource = moduleFixture.get<DataSource>(DataSource);
    await dataSource.query('DELETE FROM comments');
    await dataSource.query('DELETE FROM tasks');
    await dataSource.query('DELETE FROM projects');
    await dataSource.query('DELETE FROM organization_members');
    await dataSource.query('DELETE FROM organizations');
    await dataSource.query('DELETE FROM users');
  });

  afterAll(async () => {
    await app.close();
  });

  // ==================== AUTH ====================
  describe('Auth', () => {
    it('POST /api/v1/auth/register - should register a user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'e2e@example.com',
          password: 'password123',
          firstName: 'E2E',
          lastName: 'Test',
        })
        .expect(201);

      expect(response.body.user.email).toEqual('e2e@example.com');
      expect(response.body.tokens.accessToken).toBeDefined();

      accessToken = response.body.tokens.accessToken;
      userId = response.body.user.id;
    });

    it('POST /api/v1/auth/register - should fail with duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'e2e@example.com',
          password: 'password123',
          firstName: 'E2E',
          lastName: 'Test',
        })
        .expect(409);
    });

    it('POST /api/v1/auth/login - should login successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'e2e@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.tokens.accessToken).toBeDefined();
    });

    it('POST /api/v1/auth/login - should fail with wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'e2e@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  // ==================== USERS ====================
  describe('Users', () => {
    it('GET /api/v1/users - should return all users', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /api/v1/users/:id - should return a user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toEqual(userId);
    });

    it('GET /api/v1/users/:id - should return 404 for unknown user', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  // ==================== ORGANIZATIONS ====================
  describe('Organizations', () => {
    it('POST /api/v1/organizations - should create an organization', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'E2E Test Org',
          description: 'An organization for E2E testing',
        })
        .expect(201);

      expect(response.body.name).toEqual('E2E Test Org');
      expect(response.body.slug).toEqual('e2e-test-org');

      organizationId = response.body.id;
    });

    it('GET /api/v1/organizations - should return user organizations', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /api/v1/organizations/:id - should return an organization', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/organizations/${organizationId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toEqual(organizationId);
    });
  });

  // ==================== PROJECTS ====================
  describe('Projects', () => {
    it('POST /api/v1/projects - should create a project', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'E2E Test Project',
          description: 'A project for E2E testing',
          organizationId,
        })
        .expect(201);

      expect(response.body.name).toEqual('E2E Test Project');
      expect(response.body.organizationId).toEqual(organizationId);

      projectId = response.body.id;
    });

    it('GET /api/v1/projects - should return projects for organization', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/projects?organizationId=${organizationId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /api/v1/projects/:id - should return a project', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toEqual(projectId);
    });
  });

  // ==================== TASKS ====================
  describe('Tasks', () => {
    it('POST /api/v1/tasks - should create a task', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'E2E Test Task',
          description: 'A task for E2E testing',
          projectId,
          priority: 'high',
        })
        .expect(201);

      expect(response.body.title).toEqual('E2E Test Task');
      expect(response.body.status).toEqual('todo');

      taskId = response.body.id;
    });

    it('GET /api/v1/tasks - should return paginated tasks', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/tasks?projectId=${projectId}&page=1&limit=10`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.page).toEqual(1);
      expect(response.body.meta.limit).toEqual(10);
    });

    it('PATCH /api/v1/tasks/:id - should update a task', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'in_progress' })
        .expect(200);

      expect(response.body.status).toEqual('in_progress');
    });
  });

  // ==================== COMMENTS ====================
  describe('Comments', () => {
    it('POST /api/v1/comments - should create a comment', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'E2E test comment',
          taskId,
        })
        .expect(201);

      expect(response.body.content).toEqual('E2E test comment');
      expect(response.body.taskId).toEqual(taskId);
    });

    it('GET /api/v1/comments - should return comments for a task', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/comments?taskId=${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });
});
