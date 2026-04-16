import { describe, it, expect, beforeEach } from 'vitest';
import { Directive } from '../src/Directive.js';
import {
  directiveRegistry,
  registerDirective,
  clearRegistry,
} from '../src/Registry.js';
import type { DirectiveConstructor } from '../src/types.js';

class TestDirective extends Directive {
  static override selector = '.test';
}

class AnotherDirective extends Directive {
  static override selector = '.another';
}

class NoSelectorDirective extends Directive {
  // selector remains ''
}

describe('Registry', () => {
  beforeEach(() => {
    clearRegistry();
  });

  it('registerDirective stores by selector', () => {
    registerDirective(TestDirective as unknown as DirectiveConstructor);
    expect(directiveRegistry.get('.test')).toBe(TestDirective);
  });

  it('duplicate selector registration is deduped', () => {
    registerDirective(TestDirective as unknown as DirectiveConstructor);
    registerDirective(TestDirective as unknown as DirectiveConstructor);
    expect(directiveRegistry.size).toBe(1);
  });

  it('throws on empty selector', () => {
    expect(() => registerDirective(NoSelectorDirective as unknown as DirectiveConstructor)).toThrow(
      /no static selector/i,
    );
  });

  it('clearRegistry empties the map', () => {
    registerDirective(TestDirective as unknown as DirectiveConstructor);
    registerDirective(AnotherDirective as unknown as DirectiveConstructor);

    clearRegistry();

    expect(directiveRegistry.size).toBe(0);
  });
});
