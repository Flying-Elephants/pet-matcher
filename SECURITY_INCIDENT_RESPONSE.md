# Security Incident Response Policy (SIRP)

## 1. Objective
To define a clear and efficient process for identifying, responding to, and recovering from security incidents that may affect the Pet Matcher platform and its customers.

## 2. Incident Identification
A security incident is any event that compromises the confidentiality, integrity, or availability of Pet Matcher data. This includes:
- Unauthorized access to the database.
- Exposure of PII (Pet Profiles, Customer Names).
- Denial of Service (DoS) attacks.

## 3. Response Team
- **Incident Lead:** Primary Developer / Technical Lead.
- **Support:** Shopify Partners Support (for shop-specific breaches).

## 4. Response Workflow

### Phase 1: Detection & Analysis
- Monitor server logs (Fly.io) and Audit Logs for suspicious patterns.
- Review reports from Shopify's security team or external white-hat researchers.

### Phase 2: Containment
- **Short-term:** Rotate database credentials and encryption keys (`ENCRYPTION_KEY`).
- **Long-term:** Patch vulnerabilities in the application code.

### Phase 3: Eradication & Recovery
- Restore data from backups if corruption occurred.
- Verify all systems are secure before resuming full operations.

### Phase 4: Post-Incident Activity
- Document lessons learned.
- Notify affected merchants and Shopify within 24 hours of breach confirmation (as per Shopify's requirements).

## 5. Contact Information
For reporting security vulnerabilities, please contact: `security@pet-matcher-app.example.com`
