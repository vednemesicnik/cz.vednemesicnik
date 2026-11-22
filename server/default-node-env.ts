// Imported first by server.ts, before anything that loads React: react's CommonJS entry
// picks its development or production build from NODE_ENV when it is first required, and
// the build's environment check refuses an unset value. react-router-serve set the same
// default.
process.env.NODE_ENV ??= 'production'
