import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePublicSiteSettings } from '../lib/data/site-settings';

test('resolvePublicSiteSettings applies public branding defaults and overrides', () => {
  const defaults = resolvePublicSiteSettings();
  assert.equal(defaults.site_name, 'Sahibash');
  assert.equal(defaults.site_tagline, 'Marketplace for Afghanistan');

  const custom = resolvePublicSiteSettings({
    site_name: '  Test Bazaar  ',
    site_tagline: '  New tagline  ',
    contact_email: ' hello@test.com ',
    contact_phone: ' +123 ',
    default_locale: 'en ',
  });

  assert.equal(custom.site_name, 'Test Bazaar');
  assert.equal(custom.site_tagline, 'New tagline');
  assert.equal(custom.contact_email, 'hello@test.com');
  assert.equal(custom.contact_phone, '+123');
  assert.equal(custom.default_locale, 'en');
});
