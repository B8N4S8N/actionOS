# HIPAA Compliance Requirements for Homelessness Services Management System

## Executive Summary

This document outlines HIPAA (Health Insurance Portability and Accountability Act) compliance requirements for a homelessness services management system handling sensitive client data including PII, medical information, case notes, and staff information. While not all homelessness service providers are HIPAA "covered entities," those receiving or sharing medical information from healthcare providers must implement HIPAA-compliant technical, administrative, and physical safeguards.

---

## Table of Contents

1. [Applicability and Scope](#1-applicability-and-scope)
2. [Data Classification](#2-data-classification)
3. [Technical Safeguards (45 CFR § 164.312)](#3-technical-safeguards)
4. [Administrative Safeguards](#4-administrative-safeguards)
5. [Audit Logging Requirements](#5-audit-logging-requirements)
6. [Data Retention and Disposal](#6-data-retention-and-disposal)
7. [User Consent and Authorization](#7-user-consent-and-authorization)
8. [Breach Notification Procedures](#8-breach-notification-procedures)
9. [Implementation Checklist](#9-implementation-checklist)

---

## 1. Applicability and Scope

### 1.1 HIPAA Covered Entity Determination

| Entity Type | HIPAA Covered? | Notes |
|-------------|----------------|-------|
| Healthcare provider sharing PHI with your system | Yes | Provider is covered entity |
| Your organization receiving medical information | May be | If acting as business associate |
| HMIS (Homeless Management Information System) | Standards-based | HUD security standards reference HIPAA |
| Case management without medical data | No | Standard data protection still required |

### 1.2 Key Regulatory References

- **45 CFR § 164.312** - Technical Safeguards (Security Rule)
- **45 CFR § 164.400-414** - Breach Notification Rule
- **45 CFR § 164.524** - Individual Right of Access
- **HITECH Act** - Enhanced breach notification and enforcement

### 1.3 Relationship to HUD/HMIS Standards

HMIS (Homeless Management Information System) privacy and security standards were developed referencing HIPAA. Even if not a HIPAA covered entity, following HIPAA technical safeguards provides the strongest protection for sensitive homelessness data.

---

## 2. Data Classification

### 2.1 Protected Health Information (PHI)

Data elements that constitute PHI when linked to an individual:

```
PHI Categories in Homelessness Services:
├── Medical Information
│   ├── Addictions/Substance use history
│   ├── Current medications
│   ├── Medical conditions/issues
│   ├── Mental health diagnoses
│   ├── Treatment history
│   └── Healthcare provider information
│
├── Personal Identifiers (18 HIPAA Identifiers)
│   ├── Names
│   ├── Addresses (including homeless location details)
│   ├── Dates (birth, admission, discharge)
│   ├── Phone/fax numbers
│   ├── Email addresses
│   ├── SSN
│   ├── Medical record numbers
│   ├── Health plan beneficiary numbers
│   ├── Account numbers
│   ├── Certificate/license numbers
│   ├── Vehicle identifiers
│   ├── Device identifiers
│   ├── Web URLs
│   ├── IP addresses
│   ├── Biometric identifiers
│   ├── Photographs
│   ├── Any other unique identifying numbers
│   └── Fingerprints, voice prints
│
└── Sensitive Client Data
    ├── Case notes
    ├── Housing history
    ├── Income/financial information
    ├── Family/social relationships
    ├── Legal history
    └── Vulnerability assessments
```

### 2.2 Data Sensitivity Levels

| Level | Data Types | Protection Required |
|-------|------------|---------------------|
| **Critical** | PHI, SSN, detailed medical info | Encryption + Strict Access Controls |
| **High** | Case notes, PII, financial data | Encryption + RBAC |
| **Medium** | General demographics, service history | Access Controls |
| **Low** | Aggregated statistics, de-identified data | Standard Security |

---

## 3. Technical Safeguards (45 CFR § 164.312)

### 3.1 Access Control (§ 164.312(a))

#### 3.1.1 Unique User Identification (REQUIRED)

```typescript
// Implementation Requirements
interface UserIdentificationRequirements {
  // Every user MUST have a unique identifier
  uniqueUserId: string;  // No shared accounts allowed
  
  // Identifier must persist across sessions
  persistentIdentifier: boolean;  // Never reuse IDs
  
  // Track user identity throughout system
  trackingRequired: {
    auditLogs: true;
    sessionManagement: true;
    dataAccessRecords: true;
  };
}
```

**Technical Implementation:**
- Use UUID v4 for internal user IDs
- Never allow shared/admin accounts
- Prohibit generic logins ("admin", "staff", "user")
- Associate all actions with specific user identity

#### 3.1.2 Emergency Access Procedure (REQUIRED)

```typescript
interface EmergencyAccessProcedure {
  // Break-glass procedure for emergencies
  breakGlassAccess: {
    authorizationRequired: 'senior_management' | 'security_officer';
    timeLimited: boolean;  // Auto-expires after 24 hours
    fullAuditTrail: true;
    immediateNotification: ['security_officer', 'privacy_officer'];
  };
  
  // Emergency contact system
  emergencyContacts: {
    securityOfficer: string;
    privacyOfficer: string;
    systemAdministrator: string;
  };
  
  // Justification logging
  accessJustification: {
    required: true;
    reviewWithin: '24_hours';
    documentationRetention: '6_years';
  };
}
```

#### 3.1.3 Automatic Logoff (Addressable - REQUIRED for 2025)

```typescript
interface SessionManagement {
  // Session timeout configuration
  idleTimeout: {
    duration: number;  // 15 minutes recommended
    warningAt: number;  // 2 minutes before timeout
    extendable: boolean;  // false for high-risk data
  };
  
  // Absolute session limits
  absoluteTimeout: {
    duration: number;  // 8 hours maximum
    forcedLogout: true;
  };
  
  // Concurrent session control
  concurrentSessions: {
    maxPerUser: 1;  // Prevent session sharing
    invalidatePrevious: true;
  };
}
```

**Implementation Example:**
```typescript
// Middleware for automatic session timeout
export const sessionTimeoutMiddleware = () => {
  let idleTimer: NodeJS.Timeout;
  
  const resetTimer = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      // Log the timeout event
      auditLog.log({
        event: 'SESSION_TIMEOUT',
        userId: session.userId,
        timestamp: new Date().toISOString(),
        reason: 'idle_timeout'
      });
      
      // Force logout
      session.destroy();
    }, 15 * 60 * 1000); // 15 minutes
  };
  
  return { resetTimer };
};
```

#### 3.1.4 Encryption and Decryption (Addressable - NOW REQUIRED)

**2025 Update:** Encryption is now mandatory, no longer "addressable."

##### Data At Rest Encryption

```typescript
interface DataAtRestEncryption {
  // Database encryption
  databaseEncryption: {
    algorithm: 'AES-256-GCM' | 'AES-256-CBC';
    keyManagement: {
      provider: 'AWS_KMS' | 'Azure_Key_Vault' | 'HSM' | 'HashiCorp_Vault';
      rotationSchedule: '90_days';  // Minimum
      accessControls: 'FIPS_140-3_Level_2';
    };
    fieldLevelEncryption: {
      phiFields: ['ssn', 'medical_info', 'medications', 'diagnoses'];
      piiFields: ['email', 'phone', 'address'];
    };
  };
  
  // File storage encryption
  fileEncryption: {
    uploads: {
      encryptBeforeStorage: true;
      clientSideEncryption: true;  // Encrypt in browser before upload
    };
    backups: {
      encrypted: true;
      separateKey: true;  // Different key from production
      offlineStorage: true;
    };
  };
  
  // Application-level encryption
  applicationEncryption: {
    sensitiveFields: {
      encryptedInDatabase: true;
      decryptedInApplication: true;
      neverLogged: true;
    };
  };
}
```

**Implementation Requirements:**
- **Algorithm:** AES-256 (GCM mode preferred for authenticated encryption)
- **Key Management:** FIPS 140-3 validated cryptographic modules
- **Key Rotation:** Every 90 days for high-risk systems
- **Backup Encryption:** Separate encryption keys from production

##### Data In Transit Encryption

```typescript
interface DataInTransitEncryption {
  // TLS/SSL requirements
  tlsConfiguration: {
    minimumVersion: 'TLS_1.2';  // TLS 1.3 preferred
    deprecatedProtocols: ['SSLv2', 'SSLv3', 'TLS_1.0', 'TLS_1.1'];
    cipherSuites: {
      required: ['TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256'];
      prohibited: ['RC4', 'DES', '3DES', 'MD5', 'SHA1'];
    };
    certificate: {
      keyLength: '2048_bits_minimum';
      validity: 'max_398_days';
      caSigned: true;  // No self-signed in production
    };
  };
  
  // HSTS (HTTP Strict Transport Security)
  hsts: {
    enabled: true;
    maxAge: '1_year';
    includeSubDomains: true;
    preload: true;
  };
  
  // Internal traffic
  internalEncryption: {
    serviceToService: true;  // mTLS recommended
    databaseConnections: true;
    apiInternalCalls: true;
  };
}
```

**Nginx Configuration Example:**
```nginx
server {
    listen 443 ssl http2;
    
    # SSL Certificate
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # TLS Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # Secure cookie flag
    proxy_cookie_path / "/; secure; HttpOnly; SameSite=Strict";
}
```

### 3.2 Audit Controls (§ 164.312(b)) - REQUIRED

#### 3.2.1 Comprehensive Logging Requirements

```typescript
interface AuditLogRequirements {
  // Events to capture
  loggedEvents: {
    authentication: {
      login: true;
      logout: true;
      failedAttempts: true;
      passwordReset: true;
      mfaAttempt: true;
    };
    
    dataAccess: {
      view: true;
      create: true;
      update: true;
      delete: true;
      export: true;
      print: true;
      download: true;
    };
    
    administrative: {
      userCreated: true;
      userModified: true;
      userDeactivated: true;
      roleChanged: true;
      permissionGranted: true;
      permissionRevoked: true;
    };
    
    system: {
      configurationChange: true;
      securitySettingChange: true;
      emergencyAccess: true;
      backupOperation: true;
    };
  };
  
  // Log entry requirements
  logEntryFields: {
    timestamp: 'ISO_8601_UTC';  // Accurate time from NTP source
    eventType: string;  // Standardized taxonomy
    userId: string;  // Unique user identifier
    userRole: string;  // Role at time of access
    action: string;  // CRUD + specific actions
    resource: string;  // What was accessed
    resourceId: string;  // Specific record ID
    outcome: 'success' | 'failure' | 'denied';
    sourceIP: string;  // Client IP address
    userAgent: string;  // Browser/device info
    sessionId: string;  // Session identifier
    geolocation: 'optional';  // If available
    dataClassification: 'PHI' | 'PII' | 'sensitive' | 'general';
  };
  
  // Retention
  retention: {
    minimumPeriod: '6_years';
    storage: 'tamper_protected';
    integrityVerification: 'cryptographic_hash';
  };
}
```

#### 3.2.2 Audit Log Implementation

```typescript
// Audit logging service
class AuditLogger {
  async logAccess(
    user: User,
    action: DataAction,
    resource: ProtectedResource,
    outcome: AccessOutcome,
    metadata: LogMetadata
  ): Promise<void> {
    const logEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      eventId: generateUUID(),
      eventType: `DATA_${action.toUpperCase()}`,
      
      // User information
      userId: user.id,
      userRole: user.role,
      userEmail: hashIdentifier(user.email), // Hash PII in logs
      
      // Action details
      action: action,
      resourceType: resource.type,
      resourceId: hashIdentifier(resource.id),
      dataClassification: resource.classification,
      
      // Access context
      outcome: outcome,
      sourceIP: metadata.ipAddress,
      userAgent: metadata.userAgent,
      sessionId: metadata.sessionId,
      
      // Integrity protection
      hash: await this.computeHash(logEntry),
      signature: await this.signLog(logEntry)
    };
    
    // Write to tamper-protected storage
    await this.writeToImmutableStore(logEntry);
    
    // Real-time alerting for suspicious activity
    await this.analyzeForAnomalies(logEntry);
  }
  
  private async computeHash(entry: AuditLogEntry): Promise<string> {
    const data = JSON.stringify(entry);
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  private async analyzeForAnomalies(entry: AuditLogEntry): Promise<void> {
    // Alert on:
    // - Multiple failed login attempts
    // - After-hours access to PHI
    // - Bulk data access
    // - Access from unusual locations
    // - Privilege escalation attempts
  }
}
```

#### 3.2.3 Log Integrity Protection

```typescript
interface LogIntegrityProtection {
  // Tamper protection
  tamperProtection: {
    method: 'append_only_database' | 'blockchain' | 'WORM_storage';
    cryptographicHashing: true;
    chainVerification: true;  // Each entry references previous hash
  };
  
  // Access controls
  accessControls: {
    readAccess: ['auditor', 'security_officer', 'compliance_officer'];
    writeAccess: ['system_only'];  // No human modification
    deleteAccess: [];  // No deletion allowed
  };
  
  // Backup and archival
  backup: {
    realTimeReplication: true;
    geographicallyDistributed: true;
    regularIntegrityChecks: 'daily';
  };
}
```

### 3.3 Integrity Controls (§ 164.312(c))

#### 3.3.1 Data Integrity Verification

```typescript
interface DataIntegrityControls {
  // Input validation
  inputValidation: {
    sanitization: 'strict';  // Prevent injection attacks
    typeChecking: 'strong';  // TypeScript strict mode
    rangeValidation: true;   // Validate data ranges
    formatValidation: true;  // Regex patterns for data types
  };
  
  // Storage integrity
  storageIntegrity: {
    checksums: {
      algorithm: 'SHA-256';
      computedOn: ['write', 'read'];
      verifiedOn: ['read', 'backup'];
    };
    versionControl: true;  // Track data changes
    immutableAudit: true;  // Never modify logs
  };
  
  // Transmission integrity
  transmissionIntegrity: {
    tlsVerification: true;
    messageAuthentication: 'HMAC_SHA256';
    replayAttackPrevention: true;
  };
}
```

#### 3.3.2 Database Integrity Implementation

```sql
-- Add checksum column to all PHI tables
ALTER TABLE client_records ADD COLUMN 
  data_checksum VARCHAR(64) NOT NULL;

-- Trigger to compute checksum on insert/update
CREATE TRIGGER compute_checksum
BEFORE INSERT OR UPDATE ON client_records
FOR EACH ROW
BEGIN
  NEW.data_checksum = SHA256(
    CONCAT(NEW.first_name, NEW.last_name, NEW.ssn, ...)
  );
END;

-- Verify integrity on read
SELECT *, 
  CASE 
    WHEN data_checksum = SHA256(CONCAT(first_name, last_name, ssn, ...))
    THEN 'VALID'
    ELSE 'CORRUPTED'
  END as integrity_status
FROM client_records;
```

### 3.4 Person or Entity Authentication (§ 164.312(d)) - REQUIRED

#### 3.4.1 Multi-Factor Authentication (MFA)

```typescript
interface AuthenticationRequirements {
  // MFA for all users accessing PHI
  multiFactorAuth: {
    requiredFor: ['all_phi_access', 'administrative_functions', 'remote_access'];
    allowedMethods: [
      'TOTP_authenticator_app',      // Google Authenticator, Authy
      'hardware_security_key',        // YubiKey, FIDO2
      'push_notification',            // Duo, Microsoft Authenticator
      'SMS_backup_only'              // SMS as backup only (less secure)
    ];
    prohibitedMethods: ['email_otp', 'knowledge_based'];
    
    // MFA configuration
    config: {
      rememberDevice: false;  // Never remember for PHI access
      requireMfaEvery: 'every_login';  // No trusted device bypass
      gracePeriod: 0;  // Immediate MFA requirement
    };
  };
  
  // Password requirements
  passwordPolicy: {
    minimumLength: 12;
    complexity: {
      uppercase: 1;
      lowercase: 1;
      numbers: 1;
      special: 1;
    };
    history: 12;  // Remember 12 previous passwords
    expiration: 'never';  // NIST recommends against forced rotation
    breachChecking: true;  // Check against HaveIBeenPwned
  };
  
  // Session authentication
  sessionAuth: {
    tokenType: 'JWT' | 'session_id';
    secureCookies: true;
    httpOnly: true;
    sameSite: 'Strict';
    signature: 'RS256' | 'ES256';  // Asymmetric signing
  };
  
  // Biometric (if used)
  biometrics: {
    storage: 'template_only';  // Never store raw biometric
    encryption: 'AES-256';
    localProcessing: true;  // FIDO2/WebAuthn
  };
}
```

#### 3.4.2 Authentication Flow Implementation

```typescript
// Authentication service
class AuthenticationService {
  async authenticate(
    credentials: Credentials,
    mfaToken?: string
  ): Promise<AuthResult> {
    // Step 1: Verify primary credentials
    const user = await this.verifyPassword(
      credentials.username,
      credentials.password
    );
    
    if (!user) {
      await this.recordFailedAttempt(credentials.username);
      throw new AuthenticationError('Invalid credentials');
    }
    
    // Step 2: Verify MFA
    if (user.requiresMfa) {
      if (!mfaToken) {
        await this.sendMFAChallenge(user);
        return { status: 'MFA_REQUIRED', userId: user.id };
      }
      
      const mfaValid = await this.verifyMFA(user, mfaToken);
      if (!mfaValid) {
        await this.recordFailedMFA(user);
        throw new AuthenticationError('Invalid MFA code');
      }
    }
    
    // Step 3: Create secure session
    const session = await this.createSession(user, {
      ipAddress: credentials.ipAddress,
      userAgent: credentials.userAgent,
      deviceFingerprint: credentials.deviceFingerprint
    });
    
    // Step 4: Log successful authentication
    await auditLogger.log({
      event: 'LOGIN_SUCCESS',
      userId: user.id,
      mfaUsed: user.requiresMfa,
      ipAddress: credentials.ipAddress,
      timestamp: new Date().toISOString()
    });
    
    return { status: 'SUCCESS', session, user };
  }
}
```

### 3.5 Transmission Security (§ 164.312(e))

#### 3.5.1 API Security

```typescript
interface APISecurity {
  // API authentication
  authentication: {
    method: 'OAuth_2.0' | 'mutual_TLS';
    tokenLifetime: 'short_lived';  // 15 minutes max
    refreshTokenRotation: true;
  };
  
  // Request/response security
  dataHandling: {
    requestSizeLimit: '10MB';  // Prevent DoS
    rateLimiting: {
      window: '1_minute';
      maxRequests: 100;  // Per user
      burstAllowance: 10;
    };
    inputSanitization: 'strict';
    outputEncoding: true;  // Prevent XSS
  };
  
  // CORS policy
  cors: {
    allowedOrigins: ['https://app.yourdomain.com'];  // Explicit whitelist
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'];
    allowedHeaders: ['Authorization', 'Content-Type'];
    credentials: true;
    maxAge: 3600;
  };
  
  // Additional protections
  additional: {
    csrfProtection: true;
    clickjackingProtection: 'X-Frame-Options' | 'CSP';
    contentSecurityPolicy: "default-src 'self'";
  };
}
```

---

## 4. Administrative Safeguards

### 4.1 Security Management Process

#### 4.1.1 Risk Analysis (REQUIRED - Annual)

```typescript
interface RiskAnalysisProcess {
  frequency: 'annually' | 'upon_significant_change';
  scope: {
    electronicPHI: true;
    systems: 'all_that_handle_ephi';
    threats: ['natural', 'environmental', 'human', 'technical'];
    vulnerabilities: ['physical', 'technical', 'administrative'];
  };
  methodology: {
    threatIdentification: true;
    vulnerabilityAssessment: true;
    likelihoodAssessment: true;
    impactAnalysis: true;
    riskScoring: 'qualitative' | 'quantitative';
  };
  documentation: {
    retainedFor: '6_years';
    reviewedBy: ['security_officer', 'privacy_officer'];
    approvedBy: 'senior_management';
  };
}
```

#### 4.1.2 Risk Management

```typescript
interface RiskManagementPlan {
  // Risk mitigation strategies
  mitigation: {
    technical: ['encryption', 'access_controls', 'monitoring'];
    administrative: ['policies', 'training', 'audits'];
    physical: ['facility_security', 'workstation_security'];
  };
  
  // Risk acceptance
  riskAcceptance: {
    requiresApproval: 'senior_management';
    reviewFrequency: 'annual';
    documentationRequired: true;
  };
  
  // Sanctions policy
  sanctions: {
    workforceViolations: ['verbal_warning', 'written_warning', 'termination', 'legal_action'];
    appliedConsistently: true;
    documented: true;
  };
}
```

### 4.2 Assigned Security Responsibilities

```typescript
interface SecurityRoles {
  // Required roles
  securityOfficer: {
    responsibilities: [
      'develop_security_policies',
      'conduct_risk_assessments',
      'manage_security_incidents',
      'coordinate_training'
    ];
    authority: 'sufficient_to_implement';
    reportingTo: 'senior_management';
  };
  
  privacyOfficer: {
    responsibilities: [
      'develop_privacy_policies',
      'manage_authorizations',
      'handle_patient_rights_requests',
      'privacy_complaints'
    ];
    authority: 'sufficient_to_implement';
    reportingTo: 'senior_management';
  };
}
```

### 4.3 Workforce Training

```typescript
interface TrainingRequirements {
  // Initial training
  initialTraining: {
    timing: 'before_phi_access';
    content: [
      'HIPAA_overview',
      'security_policies',
      'privacy_policies',
      'incident_reporting',
      'password_security',
      'phishing_awareness'
    ];
    duration: 'minimum_1_hour';
    acknowledgment: true;
  };
  
  // Ongoing training
  ongoingTraining: {
    frequency: 'annual';
    content: ['policy_updates', 'incident_lessons', 'new_threats'];
    documentation: true;
  };
  
  // Specialized training
  specializedTraining: {
    itStaff: ['technical_safeguards', 'incident_response'];
    managers: ['breach_notification', 'risk_management'];
  };
}
```

### 4.4 Business Associate Agreements (BAA)

Every vendor handling PHI must sign a BAA:

```typescript
interface BAARequirements {
  requiredFor: [
    'cloud_providers',           // AWS, Azure, GCP
    'email_services',            // For PHI emails
    'analytics_services',        // If tracking users
    'backup_providers',        // Data backup services
    'development_vendors',     // External developers
    'hosting_providers',       // Infrastructure hosting
    'payment_processors'       // If healthcare-related
  ];
  
  baaContent: {
    permittedUses: 'specified_explicitly';
    safeguards: 'same_as_covered_entity';
    subcontractorControl: true;
    breachNotification: 'without_unreasonable_delay';
    auditRights: true;
    returnOrDestroy: 'at_termination';
  };
  
  verification: {
    annualReview: true;
    securityAssessment: 'questionnaire_or_audit';
    baaOnFile: true;
  };
}
```

**Example BAA Checklist for Vendors:**

| Vendor Type | BAA Required? | Verification Method |
|-------------|---------------|---------------------|
| AWS/Azure/GCP | Yes | Signed BAA + Security assessment |
| Email service (PHI) | Yes | Signed BAA + Encryption verification |
| Analytics (Mixpanel, etc.) | Maybe | If user-identifying data |
| Payment processor | Yes | PCI + HIPAA BAA |
| SMS provider | Yes | If sending PHI |
| Logging service | Yes | If logs contain PHI |

---

## 5. Audit Logging Requirements

### 5.1 Comprehensive Audit Log Specification

```typescript
// Complete audit event taxonomy
enum AuditEventType {
  // Authentication Events
  AUTH_LOGIN_SUCCESS = 'AUTH_LOGIN_SUCCESS',
  AUTH_LOGIN_FAILURE = 'AUTH_LOGIN_FAILURE',
  AUTH_LOGOUT = 'AUTH_LOGOUT',
  AUTH_MFA_SUCCESS = 'AUTH_MFA_SUCCESS',
  AUTH_MFA_FAILURE = 'AUTH_MFA_FAILURE',
  AUTH_PASSWORD_RESET = 'AUTH_PASSWORD_RESET',
  AUTH_PASSWORD_CHANGE = 'AUTH_PASSWORD_CHANGE',
  AUTH_SESSION_TIMEOUT = 'AUTH_SESSION_TIMEOUT',
  
  // Data Access Events
  DATA_VIEW = 'DATA_VIEW',
  DATA_CREATE = 'DATA_CREATE',
  DATA_UPDATE = 'DATA_UPDATE',
  DATA_DELETE = 'DATA_DELETE',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_PRINT = 'DATA_PRINT',
  DATA_DOWNLOAD = 'DATA_DOWNLOAD',
  DATA_SEARCH = 'DATA_SEARCH',
  
  // PHI-Specific Events
  PHI_ACCESS = 'PHI_ACCESS',
  PHI_DISCLOSE = 'PHI_DISCLOSE',
  PHI_AMEND = 'PHI_AMEND',
  PHI_DELETE_REQUEST = 'PHI_DELETE_REQUEST',
  
  // Administrative Events
  ADMIN_USER_CREATE = 'ADMIN_USER_CREATE',
  ADMIN_USER_UPDATE = 'ADMIN_USER_UPDATE',
  ADMIN_USER_DISABLE = 'ADMIN_USER_DISABLE',
  ADMIN_ROLE_CHANGE = 'ADMIN_ROLE_CHANGE',
  ADMIN_PERMISSION_GRANT = 'ADMIN_PERMISSION_GRANT',
  ADMIN_PERMISSION_REVOKE = 'ADMIN_PERMISSION_REVOKE',
  ADMIN_EMERGENCY_ACCESS = 'ADMIN_EMERGENCY_ACCESS',
  
  // System Events
  SYS_CONFIG_CHANGE = 'SYS_CONFIG_CHANGE',
  SYS_SECURITY_CHANGE = 'SYS_SECURITY_CHANGE',
  SYS_BACKUP = 'SYS_BACKUP',
  SYS_RESTORE = 'SYS_RESTORE',
  SYS_ERROR = 'SYS_ERROR'
}

interface AuditLogEntry {
  // Identification
  eventId: string;           // UUID v4
  eventType: AuditEventType;
  eventVersion: '1.0';
  
  // Timing
  timestamp: string;         // ISO 8601 UTC
  timezone: string;
  
  // Actor
  actor: {
    userId: string;
    userEmail: string;     // Hashed
    userRole: string;
    sessionId: string;
    ipAddress: string;
    userAgent: string;
    deviceId?: string;
    geolocation?: {
      country: string;
      region: string;
      city: string;
    };
  };
  
  // Action
  action: {
    type: string;
    status: 'success' | 'failure' | 'denied' | 'error';
    reason?: string;       // For failures
  };
  
  // Target
  target: {
    resourceType: 'client' | 'case_note' | 'medical_record' | 'staff_record' | 'report';
    resourceId: string;    // Hashed
    dataClassification: 'PHI' | 'PII' | 'sensitive' | 'general';
    fieldsAccessed?: string[];  // For fine-grained tracking
  };
  
  // Context
  context: {
    application: string;
    endpoint: string;
    requestId: string;
    correlationId: string;
  };
  
  // Integrity
  integrity: {
    hash: string;          // SHA-256 of entry
    previousHash: string;  // Chain for tamper detection
    signature?: string;      // Digital signature
  };
  
  // Compliance
  compliance: {
    hipaaRelevant: boolean;
    retentionUntil: string;  // ISO 8601 date
    accessedFor: string;     // Purpose specification
  };
}
```

### 5.2 Log Retention and Storage

```typescript
interface LogRetention {
  // Retention periods
  retention: {
    minimum: '6_years';     // HIPAA requirement
    recommended: '7_years';  // Include buffer
    specific: {
      phiAccess: '6_years';
      administrative: '6_years';
      securityIncidents: 'permanent';
    };
  };
  
  // Storage architecture
  storage: {
    hotStorage: {
      duration: '90_days';
      storage: 'write_once_database';
      searchable: true;
    };
    warmStorage: {
      duration: '1_year';
      storage: 'compressed_append_only';
      searchable: true;
    };
    coldStorage: {
      duration: '5_years';
      storage: 'encrypted_archival';
      searchable: 'index_required';
    };
  };
  
  // Backup
  backup: {
    realTimeReplication: true;
    geographicallyRedundant: true;
    encryption: 'AES-256';
    separateKeys: true;
  };
}
```

### 5.3 Real-Time Monitoring and Alerting

```typescript
interface MonitoringRules {
  // Anomaly detection
  anomalies: {
    multipleFailedLogins: {
      threshold: 5;
      window: '15_minutes';
      action: 'alert_and_temporarily_lock';
    };
    
    afterHoursAccess: {
      definition: 'outside_business_hours';
      forPhi: 'always_alert';
      action: 'alert';
    };
    
    bulkDataAccess: {
      threshold: 100;  // Records per hour
      action: 'alert_and_review';
    };
    
    unusualLocation: {
      geoAnomaly: true;
      action: 'alert';
    };
    
    privilegeEscalation: {
      anyRoleChange: 'alert';
      emergencyAccess: 'immediate_alert';
    };
  };
  
  // Alert routing
  alerting: {
    securityTeam: 'immediate';
    dataOwner: 'within_4_hours';
    complianceOfficer: 'daily_digest';
    
    channels: ['email', 'sms', 'slack', 'pagerduty'];
    escalation: {
      noAcknowledgment: '15_minutes';
      nextLevel: 'security_director';
    };
  };
}
```

---

## 6. Data Retention and Disposal

### 6.1 Retention Requirements

```typescript
interface DataRetentionPolicy {
  // HIPAA compliance documentation
  complianceDocs: {
    retention: '6_years';
    from: 'date_of_creation_or_last_effective';
    includes: [
      'policies',
      'procedures',
      'risk_assessments',
      'training_records',
      'audit_logs',
      'business_associate_agreements',
      'incident_reports'
    ];
  };
  
  // Medical records (state law governs)
  medicalRecords: {
    note: 'state_law_governs';
    typicalRange: '5_to_11_years';
    federalMinimums: {
      medicare: '6_years_from_service';
      medicaid: '6_years_from_service';
    };
    minors: 'age_of_majority_plus';
  };
  
  // Homelessness services data
  hmisData: {
    hudRequirements: 'follow_hud_standards';
    clientConsent: 'as_specified_in_consent';
    minimum: '3_years';  // Check latest HUD guidance
  };
  
  // De-identified data
  deIdentifiedData: {
    canRetain: true;
    forResearch: true;
    reIdentificationRisk: 'must_be_low';
  };
}
```

### 6.2 Secure Disposal

```typescript
interface SecureDisposal {
  // When to dispose
  triggers: [
    'retention_period_expired',
    'client_request_with_authority',
    'system_decommissioning',
    'legal_hold_released'
  ];
  
  // Electronic media
  electronicMedia: {
    methods: [
      'cryptographic_erasure',      // Delete encryption keys
      'secure_deletion',            // Overwrite (DoD 5220.22-M)
      'physical_destruction'        // For end-of-life hardware
    ];
    verification: true;
    documentation: {
      certificateOfDestruction: true;
      retainedFor: '6_years';
    };
  };
  
  // Paper records
  paperRecords: {
    methods: [
      'cross_cut_shredding',
      'pulping',
      'burning'  // If permitted locally
    ];
    vendorRequirements: ['NAID_certified'];
  };
  
  // Cloud/remote storage
  cloudStorage: {
    ensureCompleteDeletion: true;
    verifyNoBackups: true;
    contractualVerification: true;
  };
}
```

---

## 7. User Consent and Authorization

### 7.1 Consent vs. Authorization

| Aspect | Consent | Authorization |
|--------|---------|---------------|
| **Required?** | Voluntary/Optional | Mandatory for certain uses |
| **When needed** | Treatment, Payment, Operations (TPO) | Marketing, Research, Third-party disclosures |
| **Form** | Simple, can be verbal | Written, specific elements required |
| **Revocable?** | Yes | Yes |
| **Duration** | Implied or stated | Expiration date required |

### 7.2 Valid Authorization Requirements

```typescript
interface AuthorizationRequirements {
  // Required elements (45 CFR § 164.508)
  requiredElements: {
    description: 'plain_language_description_of_info';
    identifiers: 'who_can_disclose_and_receive';
    purpose: 'specific_purpose_of_disclosure';
    expiration: 'expiration_date_or_event';
    signature: 'individual_signature_and_date';
    rightToRevoke: 'statement_of_right_to_revoke';
    redisclosureNotice: 'potential_for_re_disclosure';
    treatmentCondition: 'treatment_not_conditioned_on_authorization';
  };
  
  // For homelessness services specifically
  specificUseCases: {
    housingProviders: {
      canAuthorize: true;
      broadAuthorization: {
        allowed: true;
        classDescription: 'social_services_providers';
        purposes: ['supportive_housing', 'public_benefits', 'counseling'];
      };
    };
    
    continuityOfCare: {
      withoutAuthorization: true;  // Under treatment exception
      minimumNecessary: true;
    };
    
    research: {
      requiresAuthorization: true;
      irbApproval: true;
      deIdentificationOption: true;
    };
  };
}
```

### 7.3 Patient Rights Implementation

```typescript
interface PatientRights {
  // Right of Access (45 CFR § 164.524)
  rightOfAccess: {
    scope: 'all_records_in_designated_set';
    format: 'patient_choice' | 'readable_electronic';
    timeframe: '30_days' | '60_days_with_extension';
    cost: 'reasonable_cost_based';
    denialAllowed: ['psychotherapy_notes', 'pending_litigation', 'safety_threat'];
  };
  
  // Right to Amend (45 CFR § 164.526)
  rightToAmend: {
    requestTimeframe: '60_days_to_respond';
    denialReasons: [
      'not_created_by_covered_entity',
      'not_part_of_designated_record_set',
      'not_available_for_inspection',
      'accurate_and_complete'
    ];
    statementOfDisagreement: true;
  };
  
  // Right to Accounting of Disclosures
  accountingOfDisclosures: {
    timeframe: '6_years_prior';
    exclusions: [
      'treatment_payment_healthcare_operations',
      'to_the_individual',
      'incident_to_disclosure'
    ];
  };
  
  // Right to Restrict
  rightToRestrict: {
    coveredEntityCanDecline: true;
    ifAgreed: 'must_comply';
    healthPlanRestriction: 'must_honor_if_out_of_pocket';
  };
  
  // Right to Confidential Communications
  confidentialCommunications: {
    alternativeLocation: true;
    alternativeMethod: true;
    reasonableRequest: 'must_accommodate';
  };
}
```

### 7.4 Technical Implementation for Consent Management

```typescript
// Consent management service
class ConsentManagementService {
  async createAuthorization(
    clientId: string,
    authorizationData: AuthorizationData
  ): Promise<Authorization> {
    // Validate all required elements
    this.validateAuthorization(authorizationData);
    
    const authorization: Authorization = {
      id: generateUUID(),
      clientId,
      
      // Content
      description: authorizationData.description,
      informationTypes: authorizationData.informationTypes,
      discloser: authorizationData.discloser,
      recipient: authorizationData.recipient,
      purpose: authorizationData.purpose,
      expirationDate: authorizationData.expirationDate,
      
      // Signatures
      clientSignature: {
        signature: authorizationData.signature,
        date: new Date().toISOString(),
        witnessedBy: authorizationData.witness,
        method: 'electronic' | 'physical'
      },
      
      // Required statements
      statements: {
        rightToRevoke: true,
        redisclosureNotice: true,
        treatmentCondition: true
      },
      
      // Status
      status: 'active',
      createdAt: new Date().toISOString(),
      revokedAt: null,
      
      // Audit
      auditTrail: [{
        action: 'CREATED',
        timestamp: new Date().toISOString(),
        byUser: authorizationData.createdBy
      }]
    };
    
    await this.storeAuthorization(authorization);
    
    // Log the authorization creation
    await auditLogger.log({
      event: 'AUTHORIZATION_CREATED',
      clientId,
      authorizationId: authorization.id,
      timestamp: new Date().toISOString()
    });
    
    return authorization;
  }
  
  async revokeAuthorization(
    authorizationId: string,
    revocationRequest: RevocationRequest
  ): Promise<void> {
    const authorization = await this.getAuthorization(authorizationId);
    
    // Mark as revoked
    authorization.status = 'revoked';
    authorization.revokedAt = new Date().toISOString();
    authorization.revocationReason = revocationRequest.reason;
    
    await this.updateAuthorization(authorization);
    
    // Notify all parties who received data under this authorization
    await this.notifyRecipientsOfRevocation(authorization);
    
    // Log revocation
    await auditLogger.log({
      event: 'AUTHORIZATION_REVOKED',
      authorizationId,
      clientId: authorization.clientId,
      timestamp: new Date().toISOString()
    });
  }
  
  async checkAuthorization(
    clientId: string,
    recipient: string,
    purpose: string,
    informationType: string
  ): Promise<boolean> {
    const authorizations = await this.getActiveAuthorizations(clientId);
    
    return authorizations.some(auth => 
      auth.recipient === recipient &&
      auth.purpose === purpose &&
      auth.informationTypes.includes(informationType) &&
      new Date(auth.expirationDate) > new Date()
    );
  }
}
```

---

## 8. Breach Notification Procedures

### 8.1 Breach Definition and Assessment

```typescript
interface BreachDefinition {
  // Definition (45 CFR § 164.402)
  definition: 'impermissible_use_or_disclosure_compromising_security_or_privacy';
  
  // Presumption
  presumption: 'is_breach_unless_demonstrated_low_probability';
  
  // Risk assessment factors
  riskAssessmentFactors: {
    nature: 'nature_and_extent_of_phi_involved';
    identifiers: 'types_of_identifiers_and_likelihood_of_reidentification';
    unauthorizedPerson: 'unauthorized_person_who_used_or_received';
    acquisition: 'whether_phi_was_acquired_or_viewed';
    mitigation: 'extent_to_which_risk_has_been_mitigated';
  };
  
  // Exceptions
  exceptions: {
    unintentionalGoodFaith: {
      description: 'workforce_member_unintentional_access_in_good_faith';
      condition: 'within_scope_of_authority';
    };
    inadvertentDisclosure: {
      description: 'authorized_person_to_another_authorized_person';
      condition: 'both_authorized_for_phi';
    };
    unableToRetain: {
      description: 'good_faith_belief_unable_to_retain';
    };
  };
}
```

### 8.2 Breach Notification Timeline

```typescript
interface BreachNotificationTimeline {
  // Discovery to notification
  individualNotification: {
    deadline: '60_days_from_discovery';
    withoutUnreasonableDelay: true;
    discoveryDefinition: 'first_knowledge_or_exercise_of_diligence';
  };
  
  // HHS notification
  hhsNotification: {
    over500Individuals: {
      deadline: '60_days_from_discovery';
      method: 'online_form';
      immediate: true;
    };
    under500Individuals: {
      deadline: '60_days_after_end_of_calendar_year';
      annualReport: true;
    };
  };
  
  // Media notification
  mediaNotification: {
    threshold: 'more_than_500_residents_of_state_or_jurisdiction';
    deadline: '60_days_from_discovery';
    method: 'press_release_to_prominent_media';
    content: 'same_as_individual_notice';
  };
  
  // Business associate notification
  businessAssociate: {
    toCoveredEntity: {
      deadline: '60_days_from_discovery';
      content: 'identification_of_affected_individuals';
    };
  };
}
```

### 8.3 Breach Notification Content

```typescript
interface BreachNotificationContent {
  // Individual notice requirements
  individualNotice: {
    method: 'first_class_mail' | 'email_if_agreed';
    substituteNotice: {
      when: 'insufficient_or_out_of_date_contact';
      for10OrMore: 'website_posting_90_days';
      forLessThan10: 'alternative_written' | 'telephone';
      tollFreeNumber: 'active_90_days';
    };
    
    requiredContent: {
      briefDescription: 'description_of_breach';
      typesOfInformation: 'what_information_was_involved';
      stepsToTake: 'steps_individuals_should_take';
      investigationSteps: 'what_entity_is_doing';
      contactInformation: 'contact_for_questions';
    };
  };
  
  // HHS notification
  hhsNotification: {
    method: 'online_form';
    url: 'https://ocrportal.hhs.gov/ocr/breach/breach_report.jsf';
    content: 'detailed_breach_information';
  };
}
```

### 8.4 Technical Breach Detection and Response

```typescript
interface BreachDetectionResponse {
  // Detection mechanisms
  detection: {
    automatedMonitoring: {
      intrusionDetection: true;
      anomalyDetection: true;
      accessMonitoring: true;
    };
    manualReporting: {
      workforceTraining: true;
      reportingChannels: ['hotline', 'email', 'management'];
    };
    thirdPartyNotification: {
      businessAssociates: true;
      lawEnforcement: true;
    };
  };
  
  // Incident response
  incidentResponse: {
    containment: {
      immediate: 'stop_ongoing_breach';
      isolation: 'affected_systems';
      evidencePreservation: true;
    };
    
    investigation: {
      internalTeam: ['security', 'privacy', 'legal', 'it'];
      externalResources: ['forensics', 'legal', 'pr'];
      documentation: 'comprehensive_timeline';
    };
    
    assessment: {
      riskAssessment: 'probability_of_compromise';
      scopeDetermination: 'affected_individuals_and_records';
      notificationDecision: 'within_60_days';
    };
    
    remediation: {
      vulnerabilityFixes: true;
      processImprovements: true;
      trainingUpdates: true;
      sanctions: 'if_appropriate';
    };
  };
}
```

### 8.5 Breach Notification Implementation

```typescript
// Breach notification service
class BreachNotificationService {
  async handleBreachDiscovery(
    discoveryReport: BreachDiscoveryReport
  ): Promise<BreachResponse> {
    // 1. Immediate containment
    await this.containBreach(discoveryReport);
    
    // 2. Preserve evidence
    await this.preserveEvidence(discoveryReport);
    
    // 3. Initiate investigation
    const investigation = await this.initiateInvestigation(discoveryReport);
    
    // 4. Determine scope
    const scope = await this.determineScope(investigation);
    
    // 5. Conduct risk assessment
    const riskAssessment = await this.assessRisk(scope);
    
    // 6. Determine if breach occurred
    if (riskAssessment.lowProbability) {
      return {
        status: 'NO_BREACH_CONFIRMED',
        documentation: riskAssessment.documentation
      };
    }
    
    // 7. Prepare notifications
    const notifications = await this.prepareNotifications(scope);
    
    // 8. Notify within 60 days
    await this.executeNotifications(notifications);
    
    // 9. Document everything
    await this.documentBreachResponse(discoveryReport, investigation, notifications);
    
    return {
      status: 'NOTIFICATIONS_SENT',
      timelineMet: true,
      notifications
    };
  }
  
  private async prepareNotifications(
    scope: BreachScope
  ): Promise<Notifications> {
    const affectedStates = this.groupByState(scope.affectedIndividuals);
    
    return {
      individual: await this.prepareIndividualNotices(scope.affectedIndividuals),
      
      hhs: scope.affectedIndividuals.length >= 500 
        ? await this.prepareHHSNotification(scope, 'immediate')
        : await this.prepareHHSNotification(scope, 'annual'),
      
      media: affectedStates
        .filter(state => state.count > 500)
        .map(state => this.prepareMediaNotice(state)),
      
      businessAssociates: await this.prepareBANotifications(scope)
    };
  }
  
  private async executeNotifications(notifications: Notifications): Promise<void> {
    // Track all notifications
    const notificationLog: NotificationLogEntry[] = [];
    
    // Send individual notices
    for (const notice of notifications.individual) {
      try {
        await this.sendIndividualNotice(notice);
        notificationLog.push({
          type: 'INDIVIDUAL',
          recipient: notice.recipientId,
          method: notice.method,
          sentAt: new Date().toISOString(),
          status: 'SENT'
        });
      } catch (error) {
        notificationLog.push({
          type: 'INDIVIDUAL',
          recipient: notice.recipientId,
          method: notice.method,
          attemptedAt: new Date().toISOString(),
          status: 'FAILED',
          error: error.message
        });
      }
    }
    
    // Store notification log for 6 years
    await this.storeNotificationLog(notificationLog);
  }
}
```

---

## 9. Implementation Checklist

### 9.1 Technical Implementation Checklist

#### Encryption
- [ ] Implement AES-256 encryption for data at rest
- [ ] Use TLS 1.2+ (preferably TLS 1.3) for all data in transit
- [ ] Implement field-level encryption for PHI fields
- [ ] Use FIPS 140-3 validated cryptographic modules
- [ ] Implement secure key management with 90-day rotation
- [ ] Encrypt all backups with separate keys
- [ ] Implement database encryption (TDE or application-level)

#### Access Controls
- [ ] Implement unique user identification (no shared accounts)
- [ ] Deploy role-based access control (RBAC)
- [ ] Implement multi-factor authentication (MFA) for all users
- [ ] Configure automatic session timeout (15 minutes idle)
- [ ] Implement least privilege principle
- [ ] Establish emergency access (break-glass) procedures
- [ ] Implement account lockout after failed login attempts
- [ ] Configure concurrent session limits

#### Audit Logging
- [ ] Implement comprehensive audit logging for all PHI access
- [ ] Log all authentication events (success and failure)
- [ ] Log all data access (create, read, update, delete)
- [ ] Log all administrative actions
- [ ] Include timestamps, user IDs, actions, and outcomes
- [ ] Implement log integrity protection (tamper-proof)
- [ ] Retain logs for minimum 6 years
- [ ] Configure real-time alerting for anomalies

#### Authentication
- [ ] Implement strong password policy (12+ characters, complexity)
- [ ] Deploy MFA for all access
- [ ] Use secure session management
- [ ] Implement secure cookie settings (HttpOnly, Secure, SameSite)
- [ ] Use JWT or secure session tokens with short expiration
- [ ] Implement secure password reset flow
- [ ] Check passwords against breach databases

#### Network Security
- [ ] Configure WAF (Web Application Firewall)
- [ ] Implement rate limiting
- [ ] Deploy intrusion detection/prevention
- [ ] Configure DDoS protection
- [ ] Implement API security (OAuth 2.0 or mTLS)
- [ ] Configure secure CORS policy
- [ ] Implement CSRF protection
- [ ] Deploy vulnerability scanning (quarterly)

#### Data Integrity
- [ ] Implement input validation and sanitization
- [ ] Use parameterized queries (prevent SQL injection)
- [ ] Implement data checksums/validation
- [ ] Configure database integrity constraints
- [ ] Implement version control for data changes
- [ ] Deploy XSS prevention (output encoding)

### 9.2 Administrative Checklist

#### Policies and Procedures
- [ ] Develop HIPAA Security Policies and Procedures
- [ ] Develop HIPAA Privacy Policies and Procedures
- [ ] Create Incident Response Plan
- [ ] Establish Breach Notification Procedures
- [ ] Develop Data Retention and Disposal Policy
- [ ] Create Emergency Access Procedures
- [ ] Establish Sanctions Policy
- [ ] Develop Business Continuity/Disaster Recovery Plan

#### Risk Management
- [ ] Conduct annual risk assessment
- [ ] Document risk mitigation strategies
- [ ] Implement risk management plan
- [ ] Review and update risk assessment annually
- [ ] Document risk acceptance decisions

#### Workforce
- [ ] Designate Security Officer
- [ ] Designate Privacy Officer
- [ ] Conduct HIPAA training for all workforce members
- [ ] Obtain training acknowledgments
- [ ] Conduct refresher training annually
- [ ] Implement specialized training for IT staff
- [ ] Maintain training records for 6 years

#### Business Associates
- [ ] Identify all vendors handling PHI
- [ ] Execute BAAs with all applicable vendors
- [ ] Verify vendor security practices
- [ ] Include security requirements in BAAs
- [ ] Establish breach notification from vendors
- [ ] Conduct periodic vendor assessments

### 9.3 Physical Safeguards (If Applicable)

- [ ] Control physical access to facilities
- [ ] Secure workstations (auto-lock, privacy screens)
- [ ] Control and track hardware media
- [ ] Implement device and media controls
- [ ] Secure disposal of hardware containing PHI

### 9.4 Documentation Requirements

Maintain for 6 years:
- [ ] Risk assessments and analyses
- [ ] Policies and procedures (with version history)
- [ ] Security incident reports
- [ ] Audit logs and access records
- [ ] Training records and acknowledgments
- [ ] Business Associate Agreements
- [ ] Data retention and disposal logs
- [ ] Breach notification records
- [ ] Patient authorization forms
- [ ] Patient rights requests and responses

### 9.5 Testing and Monitoring

- [ ] Conduct annual penetration testing
- [ ] Perform quarterly vulnerability scans
- [ ] Review audit logs regularly
- [ ] Test backup restoration procedures
- [ ] Conduct incident response drills
- [ ] Test disaster recovery plan
- [ ] Review and update policies annually
- [ ] Assess business associate compliance

---

## Appendix A: Data Flow Security Matrix

| Data Type | At Rest | In Transit | Access Control | Audit Log |
|-----------|---------|------------|----------------|-----------|
| Medical Information (PHI) | AES-256 | TLS 1.3 | MFA + RBAC | Full detail |
| Medications | AES-256 | TLS 1.3 | MFA + RBAC | Full detail |
| Addictions/Substance Use | AES-256 | TLS 1.3 | MFA + Strict RBAC | Full detail |
| SSN | AES-256 | TLS 1.3 | MFA + Need-to-know | Full detail |
| Case Notes | AES-256 | TLS 1.3 | RBAC | Summary |
| Demographics | Encrypted | TLS 1.2 | RBAC | Summary |
| Staff Information | Encrypted | TLS 1.2 | RBAC | Summary |
| Audit Logs | Tamper-proof | TLS 1.3 | Read-only | Immutable |

## Appendix B: 2025 Compliance Updates

The following updates strengthen HIPAA requirements effective 2025:

1. **Encryption is now mandatory** - Previously "addressable," now required for all ePHI
2. **MFA is mandatory** - Required for all systems handling ePHI
3. **Key rotation every 90 days** - For high-risk systems
4. **Updated BAAs** - Must include specific encryption and MFA requirements
5. **Annual cybersecurity certifications** - Required from business associates
6. **Enhanced documentation** - OCR expects "demonstrable, risk-based controls"

## Appendix C: Civil Penalties Reference

| Violation Type | Minimum per violation | Maximum per violation | Annual Maximum |
|----------------|----------------------|----------------------|----------------|
| Unknowing | $137 | $68,928 | $68,928 |
| Reasonable Cause | $1,379 | $68,928 | $274,192 |
| Willful Neglect (corrected) | $13,785 | $68,928 | $1,373,789 |
| Willful Neglect (not corrected) | $68,928 | $2,067,813 | $2,067,813 |

*Note: Penalty amounts are adjusted annually for inflation.*

---

**Document Control**
- Version: 1.0
- Last Updated: April 2026
- Next Review: April 2027
- Owner: Privacy Officer / Security Officer
- Classification: Internal - Confidential
