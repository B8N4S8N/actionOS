# HIPAA Technical Implementation Quick Reference Guide

## Quick Start Checklist

### Week 1: Foundation
- [ ] Enable TLS 1.3 (minimum TLS 1.2) on all connections
- [ ] Configure database encryption (AES-256)
- [ ] Implement unique user identification (UUIDs)
- [ ] Set up MFA requirement for all accounts

### Week 2: Access Controls
- [ ] Implement role-based access control (RBAC)
- [ ] Configure automatic session timeout (15 minutes)
- [ ] Implement account lockout (5 failed attempts)
- [ ] Set up break-glass emergency access

### Week 3: Audit Logging
- [ ] Implement audit logging for all PHI access
- [ ] Configure tamper-proof log storage
- [ ] Set up real-time alerting
- [ ] Ensure 6-year log retention

### Week 4: Data Protection
- [ ] Implement field-level encryption for sensitive data
- [ ] Configure secure backup encryption
- [ ] Set up secure disposal procedures
- [ ] Implement data integrity checks

---

## Implementation Code Samples

### 1. Database Encryption Setup (PostgreSQL)

```sql
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create function for encrypting sensitive fields
CREATE OR REPLACE FUNCTION encrypt_phi(data TEXT, key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        pgp_sym_encrypt(data, key, 'cipher-algo=aes256'),
        'base64'
    );
END;
$$ LANGUAGE plpgsql;

-- Create function for decrypting
CREATE OR REPLACE FUNCTION decrypt_phi(encrypted_data TEXT, key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(
        decode(encrypted_data, 'base64'),
        key
    );
END;
$$ LANGUAGE plpgsql;

-- Add encrypted columns to client table
ALTER TABLE clients ADD COLUMN ssn_encrypted TEXT;
ALTER TABLE clients ADD COLUMN medical_info_encrypted TEXT;

-- Create trigger to encrypt on insert/update
CREATE OR REPLACE FUNCTION encrypt_client_data()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ssn IS NOT NULL THEN
        NEW.ssn_encrypted := encrypt_phi(NEW.ssn, current_setting('app.encryption_key'));
        NEW.ssn := NULL; -- Clear plain text
    END IF;
    
    IF NEW.medical_info IS NOT NULL THEN
        NEW.medical_info_encrypted := encrypt_phi(NEW.medical_info, current_setting('app.encryption_key'));
        NEW.medical_info := NULL; -- Clear plain text
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER encrypt_client_trigger
    BEFORE INSERT OR UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION encrypt_client_data();
```

### 2. Session Management Middleware (Node.js/Express)

```typescript
import { Request, Response, NextFunction } from 'express';
import { AuditLogger } from './audit-logger';

interface SessionConfig {
  idleTimeout: number;      // 15 minutes = 900000 ms
  absoluteTimeout: number;  // 8 hours = 28800000 ms
  warningTime: number;      // 2 minutes = 120000 ms
}

const DEFAULT_CONFIG: SessionConfig = {
  idleTimeout: 15 * 60 * 1000,      // 15 minutes
  absoluteTimeout: 8 * 60 * 60 * 1000,  // 8 hours
  warningTime: 2 * 60 * 1000        // 2 minutes
};

export class SessionManager {
  private config: SessionConfig;
  private auditLogger: AuditLogger;
  
  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.auditLogger = new AuditLogger();
  }
  
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Check if session exists
      if (!req.session?.userId) {
        return next();
      }
      
      const now = Date.now();
      const lastActivity = req.session.lastActivity || now;
      const sessionStart = req.session.createdAt || now;
      
      // Check absolute timeout
      if (now - sessionStart > this.config.absoluteTimeout) {
        this.auditLogger.log({
          event: 'SESSION_ABSOLUTE_TIMEOUT',
          userId: req.session.userId,
          sessionId: req.session.id,
          timestamp: new Date().toISOString()
        });
        
        req.session.destroy();
        return res.status(401).json({ 
          error: 'Session expired. Please log in again.' 
        });
      }
      
      // Check idle timeout
      if (now - lastActivity > this.config.idleTimeout) {
        this.auditLogger.log({
          event: 'SESSION_IDLE_TIMEOUT',
          userId: req.session.userId,
          sessionId: req.session.id,
          idleDuration: now - lastActivity,
          timestamp: new Date().toISOString()
        });
        
        req.session.destroy();
        return res.status(401).json({ 
          error: 'Session timed out due to inactivity. Please log in again.' 
        });
      }
      
      // Check if warning should be shown
      const timeRemaining = this.config.idleTimeout - (now - lastActivity);
      if (timeRemaining <= this.config.warningTime) {
        res.setHeader('X-Session-Warning', 'true');
        res.setHeader('X-Session-Time-Remaining', timeRemaining.toString());
      }
      
      // Update last activity
      req.session.lastActivity = now;
      
      next();
    };
  }
  
  // Extend session manually (for active user interaction)
  extendSession(req: Request) {
    if (req.session) {
      req.session.lastActivity = Date.now();
    }
  }
}
```

### 3. MFA Implementation (TOTP)

```typescript
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export class MFAService {
  // Generate secret for new user
  async generateSecret(userId: string, email: string): Promise<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  }> {
    const secret = speakeasy.generateSecret({
      name: `HomelessServices:${email}`,
      length: 32
    });
    
    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
    
    // Generate backup codes (10 single-use codes)
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );
    
    // Store secret (encrypted) and backup codes (hashed)
    await this.storeSecret(userId, secret.base32);
    await this.storeBackupCodes(userId, backupCodes);
    
    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes
    };
  }
  
  // Verify TOTP code
  async verifyCode(userId: string, token: string): Promise<boolean> {
    const secret = await this.getSecret(userId);
    
    if (!secret) {
      return false;
    }
    
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1  // Allow 1 time step before/after for clock drift
    });
    
    // Check if code is a backup code
    if (!verified) {
      return await this.verifyBackupCode(userId, token);
    }
    
    return verified;
  }
  
  // Verify backup code
  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const hashedCodes = await this.getBackupCodes(userId);
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    
    const matchIndex = hashedCodes.findIndex(hc => hc.hash === codeHash);
    
    if (matchIndex >= 0 && !hashedCodes[matchIndex].used) {
      // Mark as used
      await this.markBackupCodeUsed(userId, matchIndex);
      return true;
    }
    
    return false;
  }
}
```

### 4. Audit Logger Implementation

```typescript
import { createHash, randomUUID } from 'crypto';

interface AuditLogEntry {
  eventId: string;
  eventType: string;
  timestamp: string;
  userId: string;
  userRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  dataClassification: 'PHI' | 'PII' | 'sensitive' | 'general';
  outcome: 'success' | 'failure' | 'denied';
  sourceIP: string;
  userAgent: string;
  sessionId: string;
  correlationId: string;
  hash: string;
  previousHash: string;
}

export class AuditLogger {
  private lastHash: string = '0';
  private readonly retentionDays = 6 * 365; // 6 years
  
  async log(entry: Partial<AuditLogEntry>): Promise<void> {
    const fullEntry: AuditLogEntry = {
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      correlationId: this.getCorrelationId(),
      hash: '',
      previousHash: this.lastHash,
      ...entry
    } as AuditLogEntry;
    
    // Calculate hash for integrity
    fullEntry.hash = this.computeHash(fullEntry);
    this.lastHash = fullEntry.hash;
    
    // Store in tamper-proof storage
    await this.storeLogEntry(fullEntry);
    
    // Check for anomalies
    await this.analyzeForAnomalies(fullEntry);
  }
  
  private computeHash(entry: AuditLogEntry): string {
    const data = JSON.stringify({
      eventId: entry.eventId,
      eventType: entry.eventType,
      timestamp: entry.timestamp,
      userId: entry.userId,
      action: entry.action,
      resourceId: entry.resourceId,
      previousHash: entry.previousHash
    });
    
    return createHash('sha256').update(data).digest('hex');
  }
  
  private async analyzeForAnomalies(entry: AuditLogEntry): Promise<void> {
    // Check for suspicious patterns
    const checks = [
      this.checkFailedLoginPattern(entry),
      this.checkAfterHoursAccess(entry),
      this.checkBulkAccess(entry),
      this.checkUnusualLocation(entry)
    ];
    
    const results = await Promise.all(checks);
    
    if (results.some(r => r.isAnomaly)) {
      await this.sendAlert({
        type: 'SECURITY_ANOMALY',
        severity: 'HIGH',
        details: results.filter(r => r.isAnomaly).map(r => r.reason)
      });
    }
  }
  
  private async checkFailedLoginPattern(entry: AuditLogEntry): Promise<{ isAnomaly: boolean; reason?: string }> {
    if (entry.eventType !== 'AUTH_LOGIN_FAILURE') {
      return { isAnomaly: false };
    }
    
    // Check last 15 minutes
    const recentFailures = await this.countRecentEvents({
      eventType: 'AUTH_LOGIN_FAILURE',
      sourceIP: entry.sourceIP,
      since: new Date(Date.now() - 15 * 60 * 1000)
    });
    
    if (recentFailures >= 5) {
      return { 
        isAnomaly: true, 
        reason: `Multiple failed login attempts from IP ${entry.sourceIP}` 
      };
    }
    
    return { isAnomaly: false };
  }
  
  private async checkAfterHoursAccess(entry: AuditLogEntry): Promise<{ isAnomaly: boolean; reason?: string }> {
    if (entry.dataClassification !== 'PHI') {
      return { isAnomaly: false };
    }
    
    const hour = new Date(entry.timestamp).getHours();
    const isBusinessHours = hour >= 8 && hour < 18;
    
    if (!isBusinessHours) {
      return { 
        isAnomaly: true, 
        reason: `PHI access outside business hours by ${entry.userId}` 
      };
    }
    
    return { isAnomaly: false };
  }
  
  private getCorrelationId(): string {
    // Get from request context or generate new
    return (global as any).requestContext?.correlationId || randomUUID();
  }
  
  private async storeLogEntry(entry: AuditLogEntry): Promise<void> {
    // Store in append-only database
    // Never allow modification or deletion
    await db.query(
      'INSERT INTO audit_logs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        entry.eventId,
        entry.eventType,
        entry.timestamp,
        entry.userId,
        entry.userRole,
        entry.action,
        entry.resourceType,
        entry.resourceId,
        entry.dataClassification,
        entry.outcome,
        entry.sourceIP,
        entry.userAgent,
        entry.sessionId,
        entry.correlationId,
        entry.hash,
        entry.previousHash
      ]
    );
  }
  
  private async sendAlert(alert: { type: string; severity: string; details: string[] }): Promise<void> {
    // Send to security team
    // Implementation depends on your alerting system
    console.error('SECURITY ALERT:', alert);
  }
}
```

### 5. Role-Based Access Control (RBAC)

```typescript
// Permission definitions
const Permissions = {
  // Client data permissions
  CLIENT_VIEW: 'client:view',
  CLIENT_CREATE: 'client:create',
  CLIENT_UPDATE: 'client:update',
  CLIENT_DELETE: 'client:delete',
  
  // PHI-specific permissions
  PHI_VIEW: 'phi:view',
  PHI_CREATE: 'phi:create',
  PHI_UPDATE: 'phi:update',
  
  // Medical info permissions
  MEDICAL_VIEW: 'medical:view',
  MEDICAL_CREATE: 'medical:create',
  MEDICAL_UPDATE: 'medical:update',
  
  // Administrative permissions
  USER_MANAGE: 'user:manage',
  ROLE_MANAGE: 'role:manage',
  AUDIT_VIEW: 'audit:view',
  REPORT_VIEW: 'report:view'
} as const;

// Role definitions
const Roles = {
  ADMIN: {
    name: 'Administrator',
    permissions: Object.values(Permissions),
    description: 'Full system access'
  },
  
  CASE_MANAGER: {
    name: 'Case Manager',
    permissions: [
      Permissions.CLIENT_VIEW,
      Permissions.CLIENT_CREATE,
      Permissions.CLIENT_UPDATE,
      Permissions.PHI_VIEW,
      Permissions.PHI_CREATE,
      Permissions.PHI_UPDATE,
      Permissions.REPORT_VIEW
    ],
    description: 'Can manage assigned clients and their PHI'
  },
  
  CASE_WORKER: {
    name: 'Case Worker',
    permissions: [
      Permissions.CLIENT_VIEW,
      Permissions.CLIENT_CREATE,
      Permissions.CLIENT_UPDATE,
      Permissions.PHI_VIEW  // No PHI modification
    ],
    description: 'Can view and manage clients, view PHI but not modify'
  },
  
  INTAKE_WORKER: {
    name: 'Intake Worker',
    permissions: [
      Permissions.CLIENT_VIEW,
      Permissions.CLIENT_CREATE,
      Permissions.MEDICAL_VIEW  // Limited medical view for intake
    ],
    description: 'Can create new clients and view basic information'
  },
  
  AUDITOR: {
    name: 'Auditor',
    permissions: [
      Permissions.AUDIT_VIEW,
      Permissions.REPORT_VIEW
    ],
    description: 'Can view audit logs and reports, no client data access'
  }
};

// Access control middleware
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.session?.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get user's role and permissions
    const userRole = await getUserRole(user.id);
    const role = Roles[userRole as keyof typeof Roles];
    
    if (!role) {
      return res.status(403).json({ error: 'Invalid role' });
    }
    
    // Check if user has required permission
    if (!role.permissions.includes(permission)) {
      // Log denied access attempt
      await auditLogger.log({
        eventType: 'ACCESS_DENIED',
        userId: user.id,
        action: permission,
        outcome: 'denied',
        reason: 'Insufficient permissions'
      });
      
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check data scope (for case managers - only their assigned clients)
    if (userRole === 'CASE_MANAGER') {
      const clientId = req.params.clientId || req.body.clientId;
      if (clientId && !(await isClientAssigned(user.id, clientId))) {
        await auditLogger.log({
          eventType: 'ACCESS_DENIED',
          userId: user.id,
          resourceId: clientId,
          outcome: 'denied',
          reason: 'Client not assigned to user'
        });
        
        return res.status(403).json({ error: 'Client not assigned to you' });
      }
    }
    
    next();
  };
}

// Field-level access control
export function filterFieldsByPermission(
  data: any, 
  userRole: string, 
  dataClassification: string
): any {
  const role = Roles[userRole as keyof typeof Roles];
  
  // Define field visibility by role
  const fieldVisibility: Record<string, string[]> = {
    INTAKE_WORKER: ['id', 'name', 'dateOfBirth', 'contactInfo'],
    CASE_WORKER: ['*'],  // All except some sensitive fields
    CASE_MANAGER: ['*'],  // All fields
    AUDITOR: []  // No client data
  };
  
  // Remove fields user shouldn't see
  const allowedFields = fieldVisibility[userRole] || [];
  
  if (allowedFields.includes('*')) {
    return data;  // All fields allowed
  }
  
  const filtered: any = {};
  for (const field of allowedFields) {
    if (data.hasOwnProperty(field)) {
      filtered[field] = data[field];
    }
  }
  
  return filtered;
}
```

### 6. Input Validation Middleware

```typescript
import { body, validationResult } from 'express-validator';

// Sanitization and validation rules
export const clientValidationRules = [
  body('firstName')
    .trim()
    .escape()
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Invalid first name'),
  
  body('lastName')
    .trim()
    .escape()
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Invalid last name'),
  
  body('email')
    .optional()
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage('Invalid email address'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?1?\d{10,15}$/)
    .withMessage('Invalid phone number'),
  
  body('ssn')
    .optional()
    .trim()
    .matches(/^\d{3}-?\d{2}-?\d{4}$/)
    .withMessage('Invalid SSN format'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date > now) {
        throw new Error('Date of birth cannot be in the future');
      }
      if (now.getFullYear() - date.getFullYear() > 150) {
        throw new Error('Invalid date of birth');
      }
      return true;
    }),
  
  body('medicalInfo')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .customSanitizer((value) => {
      // Remove potential script tags
      return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    })
];

// Validation middleware
export function validateInput(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Log validation failures
    auditLogger.log({
      eventType: 'INPUT_VALIDATION_FAILURE',
      sourceIP: req.ip,
      userAgent: req.get('user-agent'),
      errors: errors.array(),
      outcome: 'failure'
    });
    
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  
  next();
}
```

### 7. Secure Backup Implementation

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createReadStream } from 'fs';
import { createGzip } from 'zlib';
import crypto from 'crypto';

export class SecureBackupService {
  private s3Client: S3Client;
  private encryptionKey: Buffer;
  
  constructor() {
    this.s3Client = new S3Client({ region: process.env.AWS_REGION });
    this.encryptionKey = Buffer.from(process.env.BACKUP_ENCRYPTION_KEY!, 'base64');
  }
  
  async createEncryptedBackup(backupPath: string): Promise<{
    location: string;
    checksum: string;
    encryptionIV: string;
  }> {
    // Generate unique IV for this backup
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    
    // Read file and create stream
    const readStream = createReadStream(backupPath);
    const gzip = createGzip();
    
    // Encrypt and compress
    const encryptedChunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      readStream
        .pipe(gzip)
        .pipe(cipher)
        .on('data', (chunk) => encryptedChunks.push(chunk))
        .on('end', async () => {
          const encryptedData = Buffer.concat(encryptedChunks);
          const authTag = cipher.getAuthTag();
          
          // Combine IV, authTag, and encrypted data
          const finalData = Buffer.concat([iv, authTag, encryptedData]);
          
          // Calculate checksum
          const checksum = crypto.createHash('sha256')
            .update(finalData)
            .digest('hex');
          
          // Upload to S3 with separate encryption (client-side + server-side)
          const timestamp = new Date().toISOString();
          const s3Key = `backups/${timestamp}/backup-${timestamp}.enc`;
          
          await this.s3Client.send(new PutObjectCommand({
            Bucket: process.env.BACKUP_BUCKET!,
            Key: s3Key,
            Body: finalData,
            ChecksumSHA256: checksum,
            ServerSideEncryption: 'AES256',
            StorageClass: 'GLACIER',  // Cost-effective long-term storage
            Metadata: {
              'backup-date': timestamp,
              'checksum': checksum,
              'encrypted': 'true'
            }
          }));
          
          // Log backup creation
          await auditLogger.log({
            eventType: 'BACKUP_CREATED',
            resourceId: s3Key,
            checksum: checksum,
            outcome: 'success',
            timestamp: new Date().toISOString()
          });
          
          resolve({
            location: s3Key,
            checksum,
            encryptionIV: iv.toString('hex')
          });
        })
        .on('error', reject);
    });
  }
  
  async verifyBackupIntegrity(s3Key: string, expectedChecksum: string): Promise<boolean> {
    // Download backup
    const backupData = await this.downloadBackup(s3Key);
    
    // Calculate checksum
    const actualChecksum = crypto.createHash('sha256')
      .update(backupData)
      .digest('hex');
    
    const isValid = actualChecksum === expectedChecksum;
    
    await auditLogger.log({
      eventType: 'BACKUP_VERIFICATION',
      resourceId: s3Key,
      expectedChecksum,
      actualChecksum,
      outcome: isValid ? 'success' : 'failure'
    });
    
    return isValid;
  }
}
```

### 8. TLS/SSL Configuration (Nginx)

```nginx
# /etc/nginx/sites-available/secure-site

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;
    
    # SSL Certificates
    ssl_certificate /path/to/your/fullchain.pem;
    ssl_certificate_key /path/to/your/privkey.pem;
    
    # Modern TLS configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    
    # Strong cipher suites (only secure algorithms)
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    
    # SSL session settings
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /path/to/chain.pem;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;
    
    # Secure cookies
    proxy_cookie_path / "/; secure; HttpOnly; SameSite=Strict";
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;
    limit_req zone=one burst=20 nodelay;
    
    # Proxy to application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_hide_header X-Powered-By;
        proxy_hide_header Server;
    }
    
    # Deny access to sensitive files
    location ~ /\.(env|git|htaccess|htpasswd) {
        deny all;
    }
    
    # Hide nginx version
    server_tokens off;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### 9. Database Connection Security

```typescript
import { Pool } from 'pg';

// Secure database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // SSL/TLS configuration
  ssl: {
    rejectUnauthorized: true,  // Verify server certificate
    ca: process.env.DB_CA_CERT,  // CA certificate
    key: process.env.DB_CLIENT_KEY,  // Client key (for mutual TLS)
    cert: process.env.DB_CLIENT_CERT  // Client certificate
  },
  
  // Connection pool settings
  max: 20,  // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  
  // Application name for audit logs
  application_name: 'homeless_services_app',
  
  // Statement timeout (prevent long-running queries)
  statement_timeout: 30000,  // 30 seconds
  
  // Encrypt passwords in transit
  // PostgreSQL will use TLS for authentication
};

// Create pool with security settings
export const pool = new Pool(dbConfig);

// Query wrapper with audit logging
export async function secureQuery(
  text: string, 
  params?: any[], 
  userId?: string
): Promise<any> {
  const startTime = Date.now();
  
  try {
    const result = await pool.query(text, params);
    
    // Log query execution (without sensitive data)
    await auditLogger.log({
      eventType: 'DATABASE_QUERY',
      userId: userId || 'system',
      query: text.replace(/\$\d+/g, '?'),  // Sanitize parameters
      duration: Date.now() - startTime,
      outcome: 'success'
    });
    
    return result;
  } catch (error) {
    await auditLogger.log({
      eventType: 'DATABASE_QUERY',
      userId: userId || 'system',
      query: text.replace(/\$\d+/g, '?'),
      duration: Date.now() - startTime,
      outcome: 'failure',
      error: (error as Error).message
    });
    
    throw error;
  }
}
```

### 10. Secure API Error Handling

```typescript
// Error types that don't expose internal details
export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super('AUTH_ERROR', 401, message);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super('FORBIDDEN', 403, message);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super('VALIDATION_ERROR', 400, message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super('NOT_FOUND', 404, `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super('CONFLICT', 409, message);
  }
}

// Error handling middleware
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Default error
  let errorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  };
  let statusCode = 500;
  
  // If it's our AppError, we can safely expose details
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorResponse = {
      error: {
        code: err.code,
        message: err.message
      }
    };
  }
  
  // Log the error (with full details for internal tracking)
  auditLogger.log({
    eventType: 'ERROR',
    userId: req.session?.userId || 'anonymous',
    errorCode: (err as AppError).code || 'INTERNAL_ERROR',
    errorMessage: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode,
    outcome: 'error'
  });
  
  // Don't expose internal details for non-operational errors
  if (statusCode === 500 && !(err instanceof AppError && err.isOperational)) {
    // In production, don't expose stack traces or internal details
    if (process.env.NODE_ENV === 'production') {
      errorResponse.error.message = 'An unexpected error occurred. Please try again later.';
    }
  }
  
  res.status(statusCode).json(errorResponse);
}

// Async handler wrapper to catch errors
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

---

## Testing Your Implementation

### Security Testing Checklist

```bash
# 1. TLS/SSL Testing
# Test TLS configuration
nmap --script ssl-enum-ciphers -p 443 your-domain.com

# Test SSL Labs rating
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com

# 2. Check headers
curl -I https://your-domain.com
# Verify: Strict-Transport-Security, X-Frame-Options, etc.

# 3. Test authentication
# Attempt access without authentication
curl https://your-domain.com/api/clients
# Should return 401

# 4. Test authorization
# Attempt to access another user's data
curl -H "Authorization: Bearer USER_A_TOKEN" \
     https://your-domain.com/api/clients/USER_B_CLIENT
# Should return 403

# 5. Test SQL injection
curl -X POST https://your-domain.com/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "1\' OR \'1\'=\'1"}'
# Should not expose database structure

# 6. Test XSS
curl -X POST https://your-domain.com/api/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"firstName": "<script>alert(\'xss\')</script>"}'
# Script tags should be sanitized/escaped

# 7. Test rate limiting
for i in {1..150}; do
  curl -s -o /dev/null -w "%{http_code}" \
    https://your-domain.com/api/clients
done
# Should see 429 (Too Many Requests) after limit

# 8. Verify encryption
# Check that database columns are encrypted
psql -c "SELECT column_name, data_type 
         FROM information_schema.columns 
         WHERE table_name = 'clients' 
         AND column_name LIKE '%encrypted';"

# 9. Test session timeout
# Login, wait 16 minutes, try to access
# Should be forced to re-authenticate

# 10. Verify audit logging
# Check that all actions are logged
curl https://your-domain.com/api/audit-logs \
  -H "Authorization: Bearer ADMIN_TOKEN"
# Should see comprehensive audit trail
```

### Automated Security Scanning

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    # Run Snyk for dependency vulnerabilities
    - name: Run Snyk
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
    
    # Run OWASP ZAP baseline scan
    - name: ZAP Scan
      uses: zaproxy/action-baseline@v0.7.0
      with:
        target: 'https://staging.your-domain.com'
        rules_file_name: '.zap/rules.tsv'
    
    # Run SonarQube for code quality and security
    - name: SonarQube Scan
      uses: SonarSource/sonarqube-scan-action@master
      env:
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```

---

## Common Pitfalls to Avoid

### 1. Encryption Anti-Patterns

```typescript
// ❌ WRONG: Storing encryption key in code
const ENCRYPTION_KEY = 'hardcoded-key-12345';

// ✅ CORRECT: Use environment variable + key management service
const encryptionKey = await getKeyFromKMS();

// ❌ WRONG: Weak encryption algorithm
const cipher = crypto.createCipher('aes192', password);

// ✅ CORRECT: Use AES-256-GCM
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

// ❌ WRONG: Reusing IV
const iv = Buffer.alloc(16, 0);  // All zeros!

// ✅ CORRECT: Random IV for each encryption
const iv = crypto.randomBytes(16);
```

### 2. Authentication Anti-Patterns

```typescript
// ❌ WRONG: Storing passwords in plain text
await db.query('INSERT INTO users (password) VALUES (?)', [password]);

// ✅ CORRECT: Hash with bcrypt/argon2
const hashedPassword = await bcrypt.hash(password, 12);

// ❌ WRONG: Timing attacks in comparison
if (inputPassword === storedPassword) { ... }

// ✅ CORRECT: Constant-time comparison
const match = await bcrypt.compare(inputPassword, storedPassword);

// ❌ WRONG: Predictable session IDs
const sessionId = Date.now() + userId;

// ✅ CORRECT: Cryptographically random
const sessionId = crypto.randomBytes(32).toString('hex');
```

### 3. SQL Injection Prevention

```typescript
// ❌ WRONG: String concatenation
const query = `SELECT * FROM clients WHERE id = ${userInput}`;

// ❌ WRONG: Basic escaping (insufficient)
const query = "SELECT * FROM clients WHERE id = '" + 
              userInput.replace(/'/g, "''") + "'";

// ✅ CORRECT: Parameterized queries
const query = 'SELECT * FROM clients WHERE id = $1';
const result = await db.query(query, [userInput]);

// ✅ CORRECT: ORM with proper escaping
const client = await Client.findByPk(userInput);
```

### 4. XSS Prevention

```typescript
// ❌ WRONG: Direct output
res.send(`<div>${userInput}</div>`);

// ❌ WRONG: Basic replacement (insufficient)
const sanitized = userInput.replace(/</g, '&lt;');

// ✅ CORRECT: Use established library
import DOMPurify from 'isomorphic-dompurify';
const clean = DOMPurify.sanitize(userInput);

// ✅ CORRECT: Template engine auto-escaping
// EJS, Handlebars, React, Vue all auto-escape by default
```

---

## Resources and Tools

### Security Scanning Tools
- **OWASP ZAP**: Free web app scanner
- **Burp Suite**: Professional security testing
- **Snyk**: Dependency vulnerability scanning
- **SonarQube**: Code quality and security
- **Trivy**: Container image scanning

### Compliance Verification
- **HIPAA Security Risk Assessment Tool**: HHS-provided tool
- **NIST Cybersecurity Framework**: Comprehensive security framework
- **CIS Benchmarks**: Configuration hardening guides

### Key Libraries
```json
{
  "bcrypt": "^5.1.0",           // Password hashing
  "speakeasy": "^2.0.0",        // TOTP MFA
  "helmet": "^7.0.0",           // Security headers
  "express-rate-limit": "^6.7.0", // Rate limiting
  "dompurify": "^3.0.0",        // XSS prevention
  "express-validator": "^7.0.0", // Input validation
  "jsonwebtoken": "^9.0.0",     // JWT handling
  "node-rsa": "^1.1.0"          // RSA encryption
}
```

---

**Document Version**: 1.0
**Last Updated**: April 2026
**Review Cycle**: Quarterly
