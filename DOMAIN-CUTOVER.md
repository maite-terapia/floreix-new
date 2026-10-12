# Floreix: final domain launch checklist

The repository is prepared for **floreix.com** but the DNS is **not yet changed**. Keep WordPress and Hostalia email running until post-launch verification.

## Before changing DNS
- Backup Hostalia DNS, the WordPress database and the entire WordPress uploads directory.
- Check that GitHub Actions `deploy-pages` is green and both language sites work in GitHub Pages preview.
- Check Web3Forms account: website URL `https://floreix.com/contact/`, destination `maite@floreix.com`. Form email delivery remains unverified until a live test.
- Review privacy/cookie treatment of third-party Google Maps and Web3Forms, particularly for a psychology practice.
- Confirm Hostalia permits keeping email after canceling WordPress hosting. **Do not cancel yet**.

## Coordinated cutover
1. GitHub → repository **Settings → Pages → Custom domain**: enter `floreix.com`; save. Do this close to DNS cutover because GitHub may redirect the staging URL.
2. Hostalia DNS: replace the existing apex A `82.194.68.87` with the FOUR GitHub Pages A addresses:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
3. Replace the old **www A** `82.194.68.87` with a **www CNAME** to `maite-terapia.github.io.`. Never keep both A and CNAME for the same `www` label.
4. Leave all **NS** and **mail DNS** records untouched: MX `mx.floreix.com` (priority 10), its A `217.116.0.227`, IMAP `217.116.0.237`, POP3 `217.116.0.237`, SMTP `217.116.0.228`, Webmail `217.116.0.155`, and the SPF TXT record `v=spf1 redirect=spf.dominioabsoluto.net`. Do not delete DKIM/DMARC records if present.
5. Once DNS resolves correctly and the certificate is issued, enable **Enforce HTTPS** in GitHub Pages settings.

## Acceptance tests
- Root domain, `www` redirect and HTTPS work without certificate errors.
- Check mobile and desktop, both languages, all images, menus and Google Maps.
- Submit one harmless contact-form test in each language and confirm actual delivery to `maite@floreix.com` via Hostalia. Also test replying from that mailbox.
- `https://floreix.com/sitemap.xml` and `/robots.txt` load; add sitemap to Search Console.
- Confirm `/es/elementor-1816/` redirects to the new Spanish homepage; check 404 behavior.
- Monitor broken links and Google Search Console after launch.

## Rollback
If the new site is inaccessible, revert apex A to `82.194.68.87`; remove the `www` CNAME and restore its former A `82.194.68.87`. Preserve all mail records. Allow for DNS caching. Keep the WordPress hosting available until the migration is verified.
