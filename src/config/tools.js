const TOOLS = [
  {
    id: 'python',
    name: 'Python',
    category: 'language',
    detectCmd: 'python --version',
    versionRegex: /Python\s+(\d+\.\d+\.\d+)/,
    latestVersionApi: 'https://endoflife.date/api/python.json',
    parseLatest: (data) => data[0]?.latest,
    updateMethod: 'winget',
    elevateRequired: true,
    update: { cmd: 'winget', args: ['upgrade', 'Python.Python.3', '--accept-source-agreements'] }
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    category: 'language',
    detectCmd: 'node -v',
    versionRegex: /v(\d+\.\d+\.\d+)/,
    latestVersionApi: 'https://nodejs.org/download/release/index.json',
    parseLatest: (data) => {
      const latest = data.find(r => r.version);
      return latest ? latest.version.replace('v', '') : null;
    },
    updateMethod: 'manual',
    update: null,
    manualUpdateUrl: 'https://nodejs.org/en/download/'
  },
  {
    id: 'java',
    name: 'Java (JDK)',
    category: 'language',
    detectCmd: 'java -version',
    versionRegex: /version\s+"(\d+\.\d+\.\d+.*)"/,
    latestVersionApi: 'https://api.adoptium.net/v3/info/available_releases',
    parseLatest: (data) => data?.most_recent_lts ? data.most_recent_lts.toString() : null,
    updateMethod: 'manual',
    update: null,
    manualUpdateUrl: 'https://adoptium.net/temurin/releases/'
  },
  {
    id: 'cpp',
    name: 'C++ (g++)',
    category: 'language',
    detectCmd: 'g++ --version',
    versionRegex: /g\+\+\s+\(.*\)\s+(\d+\.\d+\.\d+)/,
    latestVersionApi: null,
    parseLatest: () => null,
    updateMethod: 'manual',
    update: null,
    manualUpdateUrl: 'https://winlibs.com/'
  },
  {
    id: 'dotnet',
    name: '.NET SDK',
    category: 'language',
    detectCmd: 'dotnet --version',
    versionRegex: /(\d+\.\d+\.\d+)/,
    latestVersionApi: 'https://dotnetcli.azureedge.net/dotnet/Sdk/LTS/latest.version',
    parseLatest: (text) => text.trim(),
    isTextApi: true,
    updateMethod: 'manual',
    update: null,
    manualUpdateUrl: 'https://dotnet.microsoft.com/en-us/download'
  },
  {
    id: 'npm',
    name: 'npm',
    category: 'package_manager',
    detectCmd: 'npm -v',
    versionRegex: /(\d+\.\d+\.\d+)/,
    latestVersionApi: 'https://registry.npmjs.org/npm/latest',
    parseLatest: (data) => data.version,
    updateMethod: 'npm',
    update: { cmd: 'npm', args: ['install', '-g', 'npm@latest'] }
  },
  {
    id: 'yarn',
    name: 'yarn',
    category: 'package_manager',
    detectCmd: 'yarn -v',
    versionRegex: /(\d+\.\d+\.\d+)/,
    latestVersionApi: 'https://registry.npmjs.org/yarn/latest',
    parseLatest: (data) => data.version,
    updateMethod: 'npm',
    update: { cmd: 'npm', args: ['install', '-g', 'yarn@latest'] }
  },
  {
    id: 'pip',
    name: 'pip',
    category: 'package_manager',
    detectCmd: 'pip --version',
    versionRegex: /pip\s+(\d+\.\d+(\.\d+)?)/,
    latestVersionApi: 'https://pypi.org/pypi/pip/json',
    parseLatest: (data) => data?.info?.version,
    updateMethod: 'python',
    update: { cmd: 'python', args: ['-m', 'pip', 'install', '--upgrade', 'pip'] }
  },
  {
    id: 'pipx',
    name: 'pipx',
    category: 'package_manager',
    detectCmd: 'pipx --version',
    versionRegex: /(\d+\.\d+\.\d+)/,
    latestVersionApi: 'https://pypi.org/pypi/pipx/json',
    parseLatest: (data) => data?.info?.version,
    updateMethod: 'python',
    update: { cmd: 'python', args: ['-m', 'pip', 'install', '--user', '--upgrade', 'pipx'] }
  },
  {
    id: 'chocolatey',
    name: 'Chocolatey',
    category: 'package_manager',
    detectCmd: 'choco -v',
    versionRegex: /(\d+\.\d+\.\d+)/,
    latestVersionApi: null,
    parseLatest: () => null,
    updateMethod: 'manual',
    update: null,
    adminCmd: 'choco upgrade all -y',
    manualUpdateUrl: 'https://chocolatey.org/'
  },
  {
    id: 'winget',
    name: 'winget',
    category: 'package_manager',
    detectCmd: 'winget --version',
    versionRegex: /v(\d+\.\d+\.\d+)/,
    latestVersionApi: null,
    parseLatest: () => null,
    updateMethod: 'manual',
    update: null,
    manualUpdateUrl: 'https://apps.microsoft.com/detail/9nblggh4nns1'
  }
];

export { TOOLS };
