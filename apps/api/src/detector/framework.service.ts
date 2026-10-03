import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FrameworkService {
  detect(projectPath: string) {
    const packagePath = path.join(
      projectPath,
      'package.json',
    );

    if (!fs.existsSync(packagePath)) {
      return {
        framework: 'static',
        buildCommand: null,
        outputDirectory: '.',
      };
    }

    const pkg = JSON.parse(
      fs.readFileSync(packagePath, 'utf8'),
    );

    const dependencies = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
    };

    if (dependencies.next) {
      return {
        framework: 'nextjs',
        buildCommand: 'npm run build',
        outputDirectory: '.next',
      };
    }

    if (dependencies.vite) {
      return {
        framework: 'vite',
        buildCommand: 'npm run build',
        outputDirectory: 'dist',
      };
    }

    if (dependencies.react) {
      return {
        framework: 'react',
        buildCommand: 'npm run build',
        outputDirectory: 'build',
      };
    }

    return {
      framework: 'node',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
    };
  }
}