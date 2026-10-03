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
        const packageManager = this.detectPackageManager(projectRoot);

        return {
          type: 'nextjs',

          name,

          installCommand:
            this.detectInstallCommand(
              projectRoot,
            ),

          buildCommand:
            scripts.build
              ? this.runPackageScript(packageManager, 'build')
              : this.runBinary(packageManager, 'next', 'build'),

          startCommand:
            `NODE_ENV=production ${this.runBinary(packageManager, 'next', 'start -H 0.0.0.0 -p 3000')}`,

          port: 3000,

          packageManager,

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
        const packageManager = this.detectPackageManager(projectRoot);

        return {
          type: 'node',

          name,

          installCommand:
            this.detectInstallCommand(
              projectRoot,
            ),

          buildCommand:
            scripts.build
              ? this.runPackageScript(packageManager, 'build')
              : null,

          startCommand:
            scripts.start
              ? this.runPackageScript(packageManager, 'start')
              : `node ${
                  packageJson.main ||
                  'server.js'
                }`,

          port: 3000,

          packageManager,

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

  private runPackageScript(
    packageManager: 'npm' | 'pnpm' | 'yarn',
    scriptName: string,
  ): string {
    if (packageManager === 'pnpm') {
      return `pnpm run ${scriptName}`;
    }

    if (packageManager === 'yarn') {
      return `yarn ${scriptName}`;
    }

    return `npm run ${scriptName}`;
  }

  private runBinary(
    packageManager: 'npm' | 'pnpm' | 'yarn',
    binaryName: string,
    args: string,
  ): string {
    if (packageManager === 'pnpm') {
      return `pnpm exec ${binaryName} ${args}`.trim();
    }

    if (packageManager === 'yarn') {
      return `yarn ${binaryName} ${args}`.trim();
    }

    return `npx ${binaryName} ${args}`.trim();
  }

  private detectInstallCommand(
    projectPath: string,
  ): string {
    const packageManager = this.detectPackageManager(projectPath);

    if (packageManager === 'pnpm') {
      return 'corepack enable && pnpm install --frozen-lockfile --prefer-offline';
    }

    if (packageManager === 'yarn') {
      return 'corepack enable && yarn install --frozen-lockfile --prefer-offline --non-interactive';
    }

    if (
      fs.existsSync(
        path.join(
          projectPath,
          'package-lock.json',
        ),
      )
    ) {
      return 'npm ci --include=dev --prefer-offline --no-audit --no-fund';
    }

    return 'npm install --include=dev --prefer-offline --no-audit --no-fund';
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
