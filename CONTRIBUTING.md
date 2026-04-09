## Contributing

Thanks for your interest in contributing to DevPulse.

### Development

- **Requirements**: Windows 10/11, Node.js, npm
- **Install**:

```bash
npm install
```

- **Run**:

```bash
npm start
```

- **Lint**:

```bash
npm run lint
```

### Adding or editing a tool

Tool definitions live in `src/config/tools.js`.

- Prefer **structured update commands**: `update: { cmd, args }`
- If the update requires admin rights, set `elevateRequired: true`
- Keep `detectCmd` fast (short timeouts, no long-running commands)
- Provide `manualUpdateUrl` when auto-update is not supported

### Pull requests

- Keep changes focused and small
- Include a short test plan in the PR description
- Avoid bundling unrelated refactors with feature changes

