const morgan = require('morgan');
const promClient = require('prom-client');
const logger = require('./logger');

// Create a Prometheus registry
const register = new promClient.Registry();

// Add default metrics (GC, memory usage, etc.)
promClient.collectDefaultMetrics({ register });

// Create custom metrics
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
});

const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const jobSearchCounter = new promClient.Counter({
  name: 'job_searches_total',
  help: 'Total number of job searches performed'
});

const jobsFoundCounter = new promClient.Counter({
  name: 'jobs_found_total',
  help: 'Total number of jobs found'
});

const applicationsSubmittedCounter = new promClient.Counter({
  name: 'applications_submitted_total',
  help: 'Total number of job applications submitted'
});

// Register custom metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestCounter);
register.registerMetric(jobSearchCounter);
register.registerMetric(jobsFoundCounter);
register.registerMetric(applicationsSubmittedCounter);

// Create Morgan token for response time
morgan.token('response-time', (req, res) => {
  if (!req.startTime) {
    return 0;
  }
  const duration = Date.now() - req.startTime;
  return duration;
});

// Create middleware for tracking request start time
const requestStartTime = (req, res, next) => {
  req.startTime = Date.now();
  next();
};

// Create middleware for logging HTTP requests with Morgan
const httpLogger = morgan(
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms',
  { stream: logger.stream }
);

// Create middleware for tracking HTTP metrics
const metricsMiddleware = (req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  
  res.on('finish', () => {
    const route = req.route ? req.route.path : req.path;
    const method = req.method;
    const statusCode = res.statusCode;
    
    end({ method, route, status_code: statusCode });
    httpRequestCounter.inc({ method, route, status_code: statusCode });
  });
  
  next();
};

// Create metrics endpoint
const metricsEndpoint = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error generating metrics', { error });
    res.status(500).end();
  }
};

// Create health check endpoint handler
const healthCheck = (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date()
  });
};

// Export monitoring components
module.exports = {
  requestStartTime,
  httpLogger,
  metricsMiddleware,
  metricsEndpoint,
  healthCheck,
  metrics: {
    jobSearchCounter,
    jobsFoundCounter,
    applicationsSubmittedCounter
  }
};
