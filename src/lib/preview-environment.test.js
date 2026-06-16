import assert from 'node:assert/strict';

import { getPreviewDemoNotice } from './preview-environment.js';

assert.equal(getPreviewDemoNotice('powerfit-demo.vercel.app'), 'Ambiente demo/preview - nao use dados reais.');
assert.equal(getPreviewDemoNotice('powerfit-demo-git-main-time.vercel.app'), 'Ambiente demo/preview - nao use dados reais.');
assert.equal(getPreviewDemoNotice('localhost'), '');
assert.equal(getPreviewDemoNotice('127.0.0.1'), '');
assert.equal(getPreviewDemoNotice('powerfit.com.br'), '');
