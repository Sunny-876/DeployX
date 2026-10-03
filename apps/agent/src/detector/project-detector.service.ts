import {
  Injectable,
} from '@nestjs/common';

import * as fs from 'fs';
import * as path from 'path';

export type ProjectType =
  | 'nextjs'
  | 'node'
  | 'static'
  | 'python'
  | 'unknown';

export interface ProjectDetection {
  type: ProjectType;

  name: string;

  installCommand: string | null;

  buildCommand: string | null;

  startCommand: string;

  port: number;

  packageManager:
    | 'npm'
    | 'pnpm'
    | 'yarn'
    | 'none';

  projectRoot: string;
}

@Injectable()
export class ProjectDetectorService {
  detect(
    inputPath: string,
  ): ProjectDetection {
    const projectRoot =
      this.findProjectRoot(
        inputPath,
      );

    const packageJsonPath =
      path.join(
        projectRoot,
        'package.json',
      );

    const hasPackageJson =
      fs.existsSync(
        packageJsonPath,
      );

    // --------------------------------
    // STATIC WEBSITE
    // --------------------------------

    if (!hasPackageJson) {
      if (
        fs.existsSync(
          path.join(
            projectRoot,
            'index.html',
          ),
        )
      ) {
        return {
          type: 'static',
          name: path.basename(
            projectRoot,
          ),

          installCommand: null,
          buildCommand: null,

          startCommand:
            'npx serve -s . -l 3000',

          port: 3000,

          packageManager: 'none',

          projectRoot,
        };
      }
    }

    // --------------------------------
    // PACKAGE.JSON
    // --------------------------------

    if (hasPackageJson) {
      const packageJson =
        this.readPackageJson(
          packageJsonPath,
        );

      const dependencies = {
        ...(packageJson.dependencies ||
          {}),
        ...(packageJson.devDependencies ||
          {}),
      };

      const scripts =
        packageJson.scripts || {};

      const name =
        packageJson.name ||
        path.basename(
          projectRoot,
        );

      // --------------------------------
      // NEXT.JS
      // --------------------------------

      if (
        dependencies.next
      ) {
        return {
          type: 'nextjs',

          name,

          installCommand:
            this.detectInstallCommand(
              projectRoot,
            ),

          buildCommand:
            scripts.build
              ? 'npm run build'
              : 'npx next build',

          startCommand:
            'NODE_ENV=production npx next start -H 0.0.0.0 -p 3000',

          port: 3000,

          packageManager:
            this.detectPackageManager(
              projectRoot,
            ),

          projectRoot,
        };
      }

      // --------------------------------
      // NODE.JS
      // --------------------------------

      if (
        scripts.start ||
        scripts.dev ||
        packageJson.main
      ) {
        return {
          type: 'node',

          name,

          installCommand:
            this.detectInstallCommand(
              projectRoot,
            ),

          buildCommand:
            scripts.build
              ? 'npm run build'
              : null,

          startCommand:
            scripts.start
              ? 'npm start'
              : `node ${
                  packageJson.main ||
                  'server.js'
                }`,

          port: 3000,

          packageManager:
            this.detectPackageManager(
              projectRoot,
            ),

          projectRoot,
        };
      }
    }

    // --------------------------------
    // PYTHON
    // --------------------------------

    if (
      fs.existsSync(
        path.join(
          projectRoot,
          'requirements.txt',
        ),
      ) ||
      fs.existsSync(
        path.join(
          projectRoot,
          'app.py',
        ),
      ) ||
      fs.existsSync(
        path.join(
          projectRoot,
          'main.py',
        ),
      )
    ) {
      const pythonFile =
        fs.existsSync(
          path.join(
            projectRoot,
            'app.py',
          ),
        )
          ? 'app.py'
          : 'main.py';

      return {
        type: 'python',

        name: path.basename(
          projectRoot,
        ),

        installCommand:
          fs.existsSync(
            path.join(
              projectRoot,
              'requirements.txt',
            ),
          )
            ? 'pip install -r requirements.txt'
            : null,

        buildCommand: null,

        startCommand:
          `python ${pythonFile}`,

        port: 3000,

        packageManager: 'none',

        projectRoot,
      };
    }

    return {
      type: 'unknown',

      name: path.basename(
        projectRoot,
      ),

      installCommand: null,
      buildCommand: null,

      startCommand: 'sleep infinity',

      port: 3000,

      packageManager: 'none',

      projectRoot,
    };
  }

  // ==================================
  // PROJECT ROOT
  // ==================================

  private findProjectRoot(
    inputPath: string,
  ): string {
    const absolutePath =
      path.resolve(inputPath);

    if (
      this.hasProjectFiles(
        absolutePath,
      )
    ) {
      return absolutePath;
    }

    let entries: fs.Dirent[];

    try {
      entries =
        fs.readdirSync(
          absolutePath,
          {
            withFileTypes: true,
          },
        );
    } catch {
      return absolutePath;
    }

    for (const entry of entries) {
      if (
        !entry.isDirectory()
      ) {
        continue;
      }

      if (
        [
          'node_modules',
          '.git',
          '.next',
          'dist',
          'build',
        ].includes(entry.name)
      ) {
        continue;
      }

      const child =
        path.join(
          absolutePath,
          entry.name,
        );

      if (
        this.hasProjectFiles(
          child,
        )
      ) {
        return child;
      }
    }

    return absolutePath;
  }

  private hasProjectFiles(
    projectPath: string,
  ): boolean {
    return (
      fs.existsSync(
        path.join(
          projectPath,
          'package.json',
        ),
      ) ||
      fs.existsSync(
        path.join(
          projectPath,
          'index.html',
        ),
      ) ||
      fs.existsSync(
        path.join(
          projectPath,
          'requirements.txt',
        ),
      ) ||
      fs.existsSync(
        path.join(
          projectPath,
          'app.py',
        ),
      ) ||
      fs.existsSync(
        path.join(
          projectPath,
          'main.py',
        ),
      )
    );
  }

  // ==================================
  // PACKAGE MANAGER
  // ==================================

  private detectPackageManager(
    projectPath: string,
  ):
    | 'npm'
    | 'pnpm'
    | 'yarn' {
    if (
      fs.existsSync(
        path.join(
          projectPath,
          'pnpm-lock.yaml',
        ),
      )
    ) {
      return 'pnpm';
    }

    if (
      fs.existsSync(
        path.join(
          projectPath,
          'yarn.lock',
        ),
      )
    ) {
      return 'yarn';
    }

    return 'npm';
  }

  private detectInstallCommand(
    projectPath: string,
  ): string {
    if (
      fs.existsSync(
        path.join(
          projectPath,
          'pnpm-lock.yaml',
        ),
      )
    ) {
      return 'corepack enable && pnpm install --frozen-lockfile';
    }

    if (
      fs.existsSync(
        path.join(
          projectPath,
          'yarn.lock',
        ),
      )
    ) {
      return 'corepack enable && yarn install --frozen-lockfile';
    }

    if (
      fs.existsSync(
        path.join(
          projectPath,
          'package-lock.json',
        ),
      )
    ) {
      return 'npm install --include=dev';
    }

    return 'npm install --include=dev';
  }

  private readPackageJson(
    filePath: string,
  ): any {
    try {
      return JSON.parse(
        fs.readFileSync(
          filePath,
          'utf8',
        ),
      );
    } catch {
      return {};
    }
  }
}
