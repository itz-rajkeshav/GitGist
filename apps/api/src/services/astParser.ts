import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

export interface FunctionInfo {
  name: string;
  params: string[];
  calls: string[];
  isAsync?: boolean;
  isExported?: boolean;
}

export interface ImportInfo {
  source: string;
  imports: string[];
  isDefault?: boolean;
  isNamespace?: boolean;
}

export interface ExportInfo {
  name: string;
  isDefault?: boolean;
  type: 'function' | 'variable' | 'class' | 'interface' | 'type';
}

export interface ASTSummary {
  functions: FunctionInfo[];
  imports: ImportInfo[];
  exports: ExportInfo[];
  classes: string[];
  variables: string[];
}

export interface FileAnalysis {
  file: string;
  ast_summary: ASTSummary;
}

export class ASTParser {
  private supportedExtensions = ['.js', '.jsx', '.ts', '.tsx'];

  isSupportedFile(filename: string): boolean {
    return this.supportedExtensions.some(ext => filename.endsWith(ext));
  }

  parseCode(code: string, filename: string): ASTSummary {
    try {
      const isTypeScript = filename.endsWith('.ts') || filename.endsWith('.tsx');
      const isJSX = filename.endsWith('.jsx') || filename.endsWith('.tsx');

      const ast = parse(code, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins: [
          'asyncGenerators',
          'bigInt',
          'classProperties',
          'decorators-legacy',
          'doExpressions',
          'dynamicImport',
          'exportDefaultFrom',
          'exportNamespaceFrom',
          'functionBind',
          'functionSent',
          'importMeta',
          'nullishCoalescingOperator',
          'numericSeparator',
          'objectRestSpread',
          'optionalCatchBinding',
          'optionalChaining',
          'throwExpressions',
          'topLevelAwait',
          ...(isTypeScript ? ['typescript' as const] : []),
          ...(isJSX ? ['jsx' as const] : [])
        ]
      });

      const functions: FunctionInfo[] = [];
      const imports: ImportInfo[] = [];
      const exports: ExportInfo[] = [];
      const classes: string[] = [];
      const variables: string[] = [];

      const self = this;
      traverse(ast, {
        FunctionDeclaration(path) {
          const node = path.node;
          if (node.id) {
            const functionInfo: FunctionInfo = {
              name: node.id.name,
              params: self.extractParams(node.params),
              calls: [],
              isAsync: node.async,
              isExported: self.isExported(path)
            };

            path.traverse({
              CallExpression(callPath) {
                const callee = callPath.node.callee;
                if (t.isIdentifier(callee)) {
                  functionInfo.calls.push(callee.name);
                } else if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
                  functionInfo.calls.push(callee.property.name);
                }
              }
            });

            functions.push(functionInfo);
          }
        },

        VariableDeclarator(path) {
          const node = path.node;
          if (t.isIdentifier(node.id) && 
              (t.isArrowFunctionExpression(node.init) || t.isFunctionExpression(node.init))) {
            const functionInfo: FunctionInfo = {
              name: node.id.name,
              params: self.extractParams(node.init.params),
              calls: [],
              isAsync: node.init.async,
              isExported: self.isExported(path)
            };

            path.traverse({
              CallExpression(callPath) {
                const callee = callPath.node.callee;
                if (t.isIdentifier(callee)) {
                  functionInfo.calls.push(callee.name);
                } else if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
                  functionInfo.calls.push(callee.property.name);
                }
              }
            });

            functions.push(functionInfo);
          } else if (t.isIdentifier(node.id)) {
            variables.push(node.id.name);
          }
        },

        ImportDeclaration(path) {
          const node = path.node;
          const importInfo: ImportInfo = {
            source: node.source.value,
            imports: [],
            isDefault: false,
            isNamespace: false
          };

          node.specifiers.forEach(spec => {
            if (t.isImportDefaultSpecifier(spec)) {
              importInfo.imports.push(spec.local.name);
              importInfo.isDefault = true;
            } else if (t.isImportNamespaceSpecifier(spec)) {
              importInfo.imports.push(spec.local.name);
              importInfo.isNamespace = true;
            } else if (t.isImportSpecifier(spec)) {
              importInfo.imports.push(spec.local.name);
            }
          });

          imports.push(importInfo);
        },

        ExportNamedDeclaration(path) {
          const node = path.node;
          if (node.declaration) {
            if (t.isFunctionDeclaration(node.declaration) && node.declaration.id) {
              exports.push({
                name: node.declaration.id.name,
                type: 'function'
              });
            } else if (t.isVariableDeclaration(node.declaration)) {
              node.declaration.declarations.forEach(decl => {
                if (t.isIdentifier(decl.id)) {
                  exports.push({
                    name: decl.id.name,
                    type: 'variable'
                  });
                }
              });
            } else if (t.isClassDeclaration(node.declaration) && node.declaration.id) {
              exports.push({
                name: node.declaration.id.name,
                type: 'class'
              });
            }
          }
        },

        ExportDefaultDeclaration(path) {
          const node = path.node;
          if (t.isFunctionDeclaration(node.declaration) && node.declaration.id) {
            exports.push({
              name: node.declaration.id.name,
              isDefault: true,
              type: 'function'
            });
          } else if (t.isIdentifier(node.declaration)) {
            exports.push({
              name: node.declaration.name,
              isDefault: true,
              type: 'variable'
            });
          }
        },

        ClassDeclaration(path) {
          const node = path.node;
          if (node.id) {
            classes.push(node.id.name);
          }
        }
      });

      return {
        functions,
        imports,
        exports,
        classes,
        variables
      };

    } catch (error) {
      console.error(`Error parsing ${filename}:`, error);
      return {
        functions: [],
        imports: [],
        exports: [],
        classes: [],
        variables: []
      };
    }
  }

  private extractParams(params: any[]): string[] {
    return params.map(param => {
      if (t.isIdentifier(param)) return param.name;
      if (t.isAssignmentPattern(param) && t.isIdentifier(param.left)) return param.left.name;
      if (t.isRestElement(param) && t.isIdentifier(param.argument)) return `...${param.argument.name}`;
      return 'unknown';
    });
  }

  private isExported(path: any): boolean {
    let parent = path.parent;
    while (parent) {
      if (t.isExportNamedDeclaration(parent) || t.isExportDefaultDeclaration(parent)) {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }
}
