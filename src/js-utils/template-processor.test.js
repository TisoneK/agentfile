/**
 * Template Processor Tests
 * 
 * @module template-processor.test
 */

const { processTemplate, render, validateTemplate } = require('./template-processor');

describe('Template Processor', () => {
  describe('Basic Variable Substitution', () => {
    test('should replace single variable placeholder with value', () => {
      const template = 'Hello {{name}}';
      const context = { name: 'World' };
      const result = processTemplate(template, context);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('Hello World');
    });

    test('should replace undefined variable with empty string', () => {
      const template = 'Hello {{name}}';
      const context = {}; // name is undefined
      const result = processTemplate(template, context);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('Hello ');
    });

    test('should handle empty context', () => {
      const template = 'Hello {{name}}';
      const context = {};
      const result = processTemplate(template, context);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('Hello ');
    });
  });

  describe('Conditional Blocks', () => {
    test('should include content when condition is true', () => {
      const template = '{{#if show}}content{{/if}}';
      const context = { show: true };
      const result = processTemplate(template, context);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('content');
    });
    
    test('should exclude content when condition is false', () => {
      const template = '{{#if show}}content{{/if}}';
      const context = { show: false };
      const result = processTemplate(template, context);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('');
    });
  });

  describe('Iteration Blocks', () => {
    test('should iterate over array', () => {
      const template = '{{#each items}}{{this}}{{/each}}';
      const context = { items: ['a', 'b', 'c'] };
      const result = processTemplate(template, context);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('abc');
    });
    
    test('should iterate over array of objects and access properties', () => {
      const template = '{{#each users}}{{name}}{{/each}}';
      const context = { users: [{ name: 'Alice' }, { name: 'Bob' }] };
      const result = processTemplate(template, context);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('AliceBob');
    });
    
    test('should handle nested iteration blocks', () => {
      const template = '{{#each rows}}{{#each cols}}{{this}}{{/each}}{{/each}}';
      const context = { rows: [{ cols: ['a', 'b'] }, { cols: ['c', 'd'] }] };
      const result = processTemplate(template, context);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('abcd');
    });
    
    test('should handle empty array', () => {
      const template = '{{#each items}}content{{/each}}';
      const context = { items: [] };
      const result = processTemplate(template, context);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('');
    });
    
    test('should return error for non-array iteration data', () => {
      const template = '{{#each items}}{{this}}{{/each}}';
      const context = { items: 'not-an-array' };
      const result = processTemplate(template, context);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ERR_TEMPLATE_INVALID_ITERABLE');
    });
    
    test('should handle iteration with variables in context', () => {
      const template = '{{#each items}}{{name}}{{/each}}';
      const context = { items: [{ name: 'Test' }] };
      const result = processTemplate(template, context);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('Test');
    });
    
    test('should handle unclosed each block error', () => {
      const template = '{{#each items}}{{this}}';
      const context = { items: ['a'] };
      const result = processTemplate(template, context);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ERR_TEMPLATE_UNCLOSED_EACH');
    });
    
    test('should handle missing endfor each block error', () => {
      const template = 'content{{/each}}';
      const context = {};
      const result = processTemplate(template, context);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ERR_TEMPLATE_MISSING_END_EACH');
    });
  });

  describe('Error Handling', () => {
    test('should return error for non-string template', () => {
      const template = 123;
      const context = { name: 'World' };
      const result = processTemplate(template, context);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ERR_TEMPLATE_INVALID_INPUT');
    });
  });

  describe('render (alias function)', () => {
    test('should work as alias to processTemplate', () => {
      const template = '{{greeting}} {{name}}';
      const context = { greeting: 'Hello', name: 'World' };
      const result = render(template, context);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('Hello World');
    });

    test('should return error object on failure for non-string template', () => {
      const template = 123; // Invalid - not a string
      const context = {};
      const result = render(template, context);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ERR_TEMPLATE_INVALID_INPUT');
    });

    test('should return error object for invalid context', () => {
      const template = 'Hello {{name}}';
      const context = 'invalid'; // Invalid - not an object
      const result = render(template, context);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ERR_TEMPLATE_INVALID_INPUT');
    });

    test('should accept options parameter for partialsDir', () => {
      const template = '{{greeting}}';
      const context = { greeting: 'Hello' };
      const result = render(template, context, { partialsDir: './partials' });
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('Hello');
    });
  });

  describe('processTemplate - Partial Templates', () => {
    describe('Basic Partial Templates', () => {
      test('should replace partial include with partial content', () => {
        const template = '{{> header}}';
        const context = { siteName: 'My Site' };
        const result = processTemplate(template, context, { partialsDir: './partials' });
        
        expect(result.success).toBe(true);
        expect(result.result).toBe('<header>Welcome to My Site</header>');
      });
      
      test('should handle partial with multiple variables', () => {
        const template = '{{> header}} {{> footer}}';
        const context = { siteName: 'My Site', year: '2026' };
        const result = processTemplate(template, context, { partialsDir: './partials' });
        
        expect(result.success).toBe(true);
        expect(result.result).toBe('<header>Welcome to My Site</header> <footer>Copyright 2026</footer>');
      });
      
      test('should handle partial in middle of content', () => {
        const template = 'Start {{> header}} Middle {{> footer}} End';
        const context = { siteName: 'Test', year: '2025' };
        const result = processTemplate(template, context, { partialsDir: './partials' });
        
        expect(result.success).toBe(true);
        expect(result.result).toBe('Start <header>Welcome to Test</header> Middle <footer>Copyright 2025</footer> End');
      });
    });

    describe('Partial with Parent Context', () => {
      test('should have access to parent context variables', () => {
        const template = '{{> header}}';
        const context = { siteName: 'Parent Site' };
        const result = processTemplate(template, context, { partialsDir: './partials' });
        
        expect(result.success).toBe(true);
        expect(result.result).toBe('<header>Welcome to Parent Site</header>');
      });
      
      test('should process variables in partial with parent context', () => {
        const template = 'Title: {{title}} {{> footer}}';
        const context = { title: 'Hello', year: '2024' };
        const result = processTemplate(template, context, { partialsDir: './partials' });
        
        expect(result.success).toBe(true);
        expect(result.result).toBe('Title: Hello <footer>Copyright 2024</footer>');
      });
    });

    describe('Nested Partials', () => {
      test('should handle partial including another partial', () => {
        const template = '{{> nested}}';
        const context = { variable: 'test' };
        const result = processTemplate(template, context, { partialsDir: './partials' });
        
        expect(result.success).toBe(true);
        expect(result.result.trim()).toBe('<div class="nested">This is nested content with test</div>');
      });
    });

    describe('Partial with Conditionals and Iterations', () => {
      test('should handle partial with conditionals', () => {
        const template = '{{#if show}}{{> header}}{{/if}}';
        const context = { show: true, siteName: 'Cond Site' };
        const result = processTemplate(template, context, { partialsDir: './partials' });
        
        expect(result.success).toBe(true);
        expect(result.result).toBe('<header>Welcome to Cond Site</header>');
      });
      
      test('should handle partial inside conditional that is false', () => {
        const template = '{{#if show}}{{> header}}{{/if}}';
        const context = { show: false, siteName: 'Cond Site' };
        const result = processTemplate(template, context, { partialsDir: './partials' });
        
        expect(result.success).toBe(true);
        expect(result.result).toBe('');
      });
      
      test('should handle partial with iterations', () => {
        const template = '{{#each items}}{{> nested}}{{/each}}';
        const context = { items: [{ variable: 'a' }, { variable: 'b' }] };
        const result = processTemplate(template, context, { partialsDir: './partials' });
        
        expect(result.success).toBe(true);
        expect(result.result).toContain('This is nested content with a');
        expect(result.result).toContain('This is nested content with b');
      });
    });

    describe('Error Handling - Partials', () => {
      test('should return error for missing partial file', () => {
        const template = '{{> nonexistent}}';
        const context = {};
        const result = processTemplate(template, context, { partialsDir: './partials' });
        
        expect(result.success).toBe(false);
        expect(result.error.code).toBe('ERR_TEMPLATE_PARTIAL_NOT_FOUND');
      });
    });

    describe('Processing Order', () => {
      test('should process conditionals before partials', () => {
        const template = '{{#if show}}{{> header}}{{/if}}';
        const context = { show: true, siteName: 'Order Test' };
        const result = processTemplate(template, context, { partialsDir: './partials' });
        
        expect(result.success).toBe(true);
        expect(result.result).toBe('<header>Welcome to Order Test</header>');
      });
      
      test('should process iterations before partials', () => {
        const template = '{{#each items}}{{> nested}}{{/each}}';
        const context = { items: [{ variable: 'test' }] };
        const result = processTemplate(template, context, { partialsDir: './partials' });
        
        expect(result.success).toBe(true);
        expect(result.result.trim()).toBe('<div class="nested">This is nested content with test</div>');
      });
      
      test('should process partials before variable substitution', () => {
        const template = '{{> header}}';
        const context = { siteName: 'Final Test' };
        const result = processTemplate(template, context, { partialsDir: './partials' });
        
        expect(result.success).toBe(true);
        expect(result.result).toBe('<header>Welcome to Final Test</header>');
      });
    });
  });

  describe('validateTemplate', () => {
    describe('Valid templates', () => {
      test('should return valid for empty template', () => {
        const template = '';
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      test('should return valid for template with only text', () => {
        const template = 'Hello World';
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      test('should return valid for template with variables', () => {
        const template = 'Hello {{name}}, welcome to {{place}}';
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      test('should return valid for template with conditionals', () => {
        const template = '{{#if show}}content{{/if}}';
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      test('should return valid for template with iterations', () => {
        const template = '{{#each items}}{{this}}{{/each}}';
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      test('should return valid for template with partials', () => {
        const template = '{{> header}}';
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      test('should return valid for complex nested template', () => {
        const template = `{{#if show}}
  {{#each items}}
    {{name}} - {{> partial}}
  {{/each}}
{{/if}}`;
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    describe('Invalid variable syntax', () => {
      test('should detect empty variable braces', () => {
        const template = 'Hello {{}}';
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].type).toBe('INVALID_VARIABLE');
        expect(result.errors[0].message).toContain('Empty');
      });

      test('should detect nested braces in variable', () => {
        const template = 'Hello {{ {{nested}} }}';
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(false);
        const nestedError = result.errors.find(e => e.type === 'INVALID_SYNTAX');
        expect(nestedError).toBeDefined();
        expect(nestedError.message).toContain('Nested');
      });
    });

    describe('Unclosed conditional blocks', () => {
      test('should detect unclosed #if block', () => {
        const template = '{{#if show}}content';
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(false);
        const unclosedError = result.errors.find(e => e.type === 'UNCLOSED_TAG');
        expect(unclosedError).toBeDefined();
        expect(unclosedError.message).toContain('{{#if}}');
      });

      test('should detect multiple unclosed #if blocks', () => {
        const template = '{{#if a}}a{{#if b}}b';
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(false);
        const unclosedErrors = result.errors.filter(e => e.type === 'UNCLOSED_TAG');
        expect(unclosedErrors.length).toBe(2);
      });
    });

    describe('Unclosed iteration blocks', () => {
      test('should detect unclosed #each block', () => {
        const template = '{{#each items}}{{this}}';
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(false);
        const unclosedError = result.errors.find(e => e.type === 'UNCLOSED_TAG');
        expect(unclosedError).toBeDefined();
        expect(unclosedError.message).toContain('{{#each}}');
      });
    });

    describe('Unopened closing tags', () => {
      test('should detect unopened #/if', () => {
        const template = 'content{{/if}}';
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(false);
        const unopenedError = result.errors.find(e => e.type === 'UNOPENED_TAG');
        expect(unopenedError).toBeDefined();
        expect(unopenedError.message).toContain('{{/if}}');
      });

      test('should detect unopened #/each', () => {
        const template = 'content{{/each}}';
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(false);
        const unopenedError = result.errors.find(e => e.type === 'UNOPENED_TAG');
        expect(unopenedError).toBeDefined();
        expect(unopenedError.message).toContain('{{/each}}');
      });
    });

    describe('Mismatched tags', () => {
      test('should detect mismatched #if and #/each', () => {
        const template = '{{#if show}}content{{/each}}';
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(false);
        const mismatchedError = result.errors.find(e => e.type === 'MISMATCHED_TAGS');
        expect(mismatchedError).toBeDefined();
        expect(mismatchedError.message).toContain('Mismatched');
      });

      test('should detect mismatched #each and #/if', () => {
        const template = '{{#each items}}content{{/if}}';
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(false);
        const mismatchedError = result.errors.find(e => e.type === 'MISMATCHED_TAGS');
        expect(mismatchedError).toBeDefined();
      });
    });

    describe('Invalid partial syntax', () => {
      test('should detect empty partial name', () => {
        const template = 'Hello {{>}}';
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(false);
        const error = result.errors.find(e => e.type === 'INVALID_SYNTAX');
        expect(error).toBeDefined();
        expect(error.message).toContain('Empty partial');
      });
    });

    describe('Line number tracking', () => {
      test('should include line numbers in errors', () => {
        const template = 'line1\nline2\n{{#if show}}content';
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(false);
        const unclosedError = result.errors.find(e => e.type === 'UNCLOSED_TAG');
        expect(unclosedError).toBeDefined();
        expect(unclosedError.line).toBe(3);
        expect(unclosedError.column).toBeDefined();
      });

      test('should track line numbers for multiple errors', () => {
        const template = '{{#if a}}\n{{#if b}}\ncontent\n{{/if}}';
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(false);
        // Should have unclosed #if error
        const unclosedErrors = result.errors.filter(e => e.type === 'UNCLOSED_TAG');
        expect(unclosedErrors.length).toBe(1);
      });
    });

    describe('Nested structure validation', () => {
      test('should validate nested conditionals correctly', () => {
        const template = '{{#if a}}{{#if b}}content{{/if}}{{/if}}';
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      test('should validate nested iterations correctly', () => {
        const template = '{{#each items}}{{#each inner}}{{this}}{{/each}}{{/each}}';
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      test('should validate mixed nesting', () => {
        const template = '{{#if show}}{{#each items}}{{name}}{{/each}}{{/if}}';
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    describe('Non-string input', () => {
      test('should return error for non-string template', () => {
        const template = 123;
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(false);
        expect(result.errors[0].message).toContain('must be a string');
      });

      test('should return error for null template', () => {
        const template = null;
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(false);
        expect(result.errors[0].message).toContain('must be a string');
      });

      test('should return error for undefined template', () => {
        const template = undefined;
        const result = validateTemplate(template);
        
        expect(result.valid).toBe(false);
        expect(result.errors[0].message).toContain('must be a string');
      });
    });
  });
});
