/**
 * Optima Recruitment Backend v1.1
 * Google Apps Script backend for:
 * - Contact enquiries
 * - Consultation requests
 * - Vacancy submissions
 * - Candidate applications
 *
 * Run setupOptimaBackend() once before deployment.
 */

const CONFIG = {
  VERSION: '1.1.0',
  BUSINESS_NAME: 'Optima Talent, Workforce & Business Solutions',
  BUSINESS_EMAIL: 'info@optimasolutionsintl.com',
  TIMEZONE: 'Europe/Dublin',
  MAX_FILE_BYTES: 5 * 1024 * 1024,
  ALLOWED_FILE_EXTENSIONS: ['pdf', 'doc', 'docx', 'ppt', 'pptx'],
  SPREADSHEET_NAME: 'Optima Recruitment Backend',
  ROOT_FOLDER_NAME: 'Optima Recruitment Backend',
  SCRIPT_PROPERTY_SPREADSHEET_ID: 'OPTIMA_SPREADSHEET_ID',
  SCRIPT_PROPERTY_ROOT_FOLDER_ID: 'OPTIMA_ROOT_FOLDER_ID'
};

const SHEETS = {
  DASHBOARD: 'Dashboard',
  EMPLOYERS: 'Employers',
  CONTACTS: 'Employer Contacts',
  VACANCIES: 'Vacancies',
  CANDIDATES: 'Candidates',
  APPLICATIONS: 'Applications',
  CONSULTATIONS: 'Consultations',
  ENQUIRIES: 'Enquiries',
  ACTIVITY: 'Activity Log',
  ERRORS: 'Error Log'
};

const HEADERS = {
  [SHEETS.EMPLOYERS]: [
    'Employer ID','Created At','Organisation','Website','Industry','Address',
    'Status','Owner','Notes','Last Updated'
  ],
  [SHEETS.CONTACTS]: [
    'Contact ID','Created At','Employer ID','Organisation','Name','Job Title',
    'Email','Telephone','Preferred Contact','Status','Owner','Notes','Last Updated'
  ],
  [SHEETS.VACANCIES]: [
    'Vacancy ID','Created At','Employer ID','Contact ID','Organisation','Contact Name',
    'Email','Telephone','Role Title','Location','Employment Type','Salary',
    'Number of Positions','Start Date','Workplace','Hiring Urgency',
    'Job Description Link','GDPR Consent','Source','Status','Owner','Notes','Last Updated'
  ],
  [SHEETS.CANDIDATES]: [
    'Candidate ID','Created At','First Name','Last Name','Email','Telephone',
    'Location','Country','Profession','Current Job Title','LinkedIn',
    'CV Link','GDPR Consent','Marketing Consent','Source','Status','Owner','Notes','Last Updated'
  ],
  [SHEETS.APPLICATIONS]: [
    'Application ID','Created At','Candidate ID','Vacancy ID','Role Title',
    'Application Status','Source','Owner','Notes','Last Updated'
  ],
  [SHEETS.CONSULTATIONS]: [
    'Consultation ID','Created At','Name','Organisation','Email','Telephone',
    'Service','Preferred Date','Message','GDPR Consent','Source','Status','Owner','Notes','Last Updated'
  ],
  [SHEETS.ENQUIRIES]: [
    'Enquiry ID','Created At','Name','Organisation','Email','Telephone',
    'Subject','Message','GDPR Consent','Source','Status','Owner','Notes','Last Updated'
  ],
  [SHEETS.ACTIVITY]: [
    'Activity ID','Timestamp','Record Type','Record ID','Action','Details','Actor'
  ],
  [SHEETS.ERRORS]: [
    'Error ID','Timestamp','Context','Message','Stack','Payload'
  ]
};

function setupOptimaBackend() {
  validateConfiguration_();

  const props = PropertiesService.getScriptProperties();
  let spreadsheet = null;
  let rootFolder = null;

  const existingSpreadsheetId = props.getProperty(CONFIG.SCRIPT_PROPERTY_SPREADSHEET_ID);
  if (existingSpreadsheetId) {
    spreadsheet = SpreadsheetApp.openById(existingSpreadsheetId);
  } else {
    spreadsheet = SpreadsheetApp.create(CONFIG.SPREADSHEET_NAME);
    spreadsheet.setSpreadsheetTimeZone(CONFIG.TIMEZONE);
    props.setProperty(CONFIG.SCRIPT_PROPERTY_SPREADSHEET_ID, spreadsheet.getId());
  }

  const existingRootFolderId = props.getProperty(CONFIG.SCRIPT_PROPERTY_ROOT_FOLDER_ID);
  if (existingRootFolderId) {
    rootFolder = DriveApp.getFolderById(existingRootFolderId);
  } else {
    rootFolder = DriveApp.createFolder(CONFIG.ROOT_FOLDER_NAME);
    rootFolder.createFolder('Candidate CVs');
    rootFolder.createFolder('Vacancy Documents');
    rootFolder.createFolder('Other Uploads');
    props.setProperty(CONFIG.SCRIPT_PROPERTY_ROOT_FOLDER_ID, rootFolder.getId());
  }

  Object.keys(HEADERS).forEach(name => ensureSheet_(spreadsheet, name, HEADERS[name]));
  ensureDashboard_(spreadsheet);

  logActivity_('System', 'SYSTEM', 'Setup', 'Backend setup completed');
  SpreadsheetApp.flush();

  const result = {
    success: true,
    spreadsheetUrl: spreadsheet.getUrl(),
    rootFolderUrl: rootFolder.getUrl(),
    message: 'Optima Recruitment Backend setup completed successfully.'
  };

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function doGet() {
  return jsonResponse_({
    success: true,
    service: 'Optima Recruitment Backend',
    version: CONFIG.VERSION,
    status: 'online',
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  let payload = {};
  try {
    payload = parseRequest_(e);

    if (payload.website || payload.company_website_hidden) {
      return responseForRequest_(payload, { success: true, message: 'Submission received.' });
    }

    const formType = normalise_(payload.formType || payload.form_type || payload.type);
    if (!formType) throw new Error('Missing formType.');

    let result;
    switch (formType) {
      case 'contact':
      case 'enquiry':
        result = handleEnquiry_(payload);
        break;
      case 'consultation':
        result = handleConsultation_(payload);
        break;
      case 'vacancy':
        result = handleVacancy_(payload);
        break;
      case 'candidate':
      case 'application':
        result = handleCandidate_(payload);
        break;
      default:
        throw new Error('Unsupported formType: ' + formType);
    }

    return responseForRequest_(payload, Object.assign({ success: true }, result));
  } catch (error) {
    logError_('doPost', error, payload);
    return responseForRequest_(payload, {
      success: false,
      message: 'We could not process your submission. Please contact Optima directly.',
      error: error.message
    });
  }
}

function handleEnquiry_(p) {
  requireFields_(p, ['name','email','message']);
  validateEmail_(p.email);
  requireConsent_(p);

  const id = nextId_('ENQ');
  appendRecord_(SHEETS.ENQUIRIES, [
    id, new Date(), clean_(p.name), clean_(p.organisation), clean_(p.email),
    clean_(p.telephone), clean_(p.subject), clean_(p.message),
    consentValue_(p), sourceValue_(p), 'New', '', '', new Date()
  ]);

  logActivity_('Enquiry', id, 'Created', clean_(p.subject || 'Website enquiry'));
  notify_('New website enquiry: ' + id, buildEmailBody_('Enquiry', id, p));
  return { id, message: 'Thank you. Your enquiry has been received.' };
}

function handleConsultation_(p) {
  requireFields_(p, ['name','email']);
  validateEmail_(p.email);
  requireConsent_(p);

  const id = nextId_('CON');
  appendRecord_(SHEETS.CONSULTATIONS, [
    id, new Date(), clean_(p.name), clean_(p.organisation), clean_(p.email),
    clean_(p.telephone), clean_(p.service), clean_(p.preferredDate || p.preferred_date),
    clean_(p.message), consentValue_(p), sourceValue_(p),
    'New', '', '', new Date()
  ]);

  logActivity_('Consultation', id, 'Created', clean_(p.service || 'Consultation request'));
  notify_('New consultation request: ' + id, buildEmailBody_('Consultation', id, p));
  return { id, message: 'Thank you. Your consultation request has been received.' };
}

function handleVacancy_(p) {
  requireFields_(p, ['organisation','contactName','email','roleTitle']);
  validateEmail_(p.email);
  requireConsent_(p);

  const employerId = findOrCreateEmployer_(p);
  const contactId = findOrCreateEmployerContact_(p, employerId);
  const vacancyId = nextId_('VAC');
  const documentLink = saveOptionalFile_(p, 'jobDescription', 'Vacancy Documents', vacancyId);

  appendRecord_(SHEETS.VACANCIES, [
    vacancyId, new Date(), employerId, contactId, clean_(p.organisation),
    clean_(p.contactName), clean_(p.email), clean_(p.telephone),
    clean_(p.roleTitle), clean_(p.location), clean_(p.employmentType),
    clean_(p.salary), clean_(p.numberOfPositions), clean_(p.startDate),
    clean_(p.workplace), clean_(p.hiringUrgency), documentLink,
    consentValue_(p), sourceValue_(p), 'New', '', clean_(p.notes), new Date()
  ]);

  logActivity_('Vacancy', vacancyId, 'Created', clean_(p.roleTitle));
  notify_('New vacancy submission: ' + vacancyId, buildEmailBody_('Vacancy', vacancyId, p));
  return { id: vacancyId, employerId, contactId, message: 'Thank you. Your vacancy has been submitted.' };
}

function handleCandidate_(p) {
  requireFields_(p, ['firstName','lastName','email']);
  validateEmail_(p.email);
  requireConsent_(p);

  const duplicate = findCandidateByEmail_(p.email);
  const candidateId = duplicate || nextId_('CAN');
  const cvLink = saveOptionalFile_(p, 'cv', 'Candidate CVs', candidateId);

  if (duplicate) {
    updateCandidate_(candidateId, p, cvLink);
    logActivity_('Candidate', candidateId, 'Updated', 'Duplicate email matched and record updated');
  } else {
    appendRecord_(SHEETS.CANDIDATES, [
      candidateId, new Date(), clean_(p.firstName), clean_(p.lastName),
      clean_(p.email), clean_(p.telephone), clean_(p.location), clean_(p.country),
      clean_(p.profession), clean_(p.currentJobTitle), clean_(p.linkedin),
      cvLink, consentValue_(p), marketingConsentValue_(p), sourceValue_(p),
      'New', '', clean_(p.notes), new Date()
    ]);
    logActivity_('Candidate', candidateId, 'Created', clean_(p.firstName + ' ' + p.lastName));
  }

  if (p.vacancyId || p.roleTitle) {
    const appId = nextId_('APP');
    appendRecord_(SHEETS.APPLICATIONS, [
      appId, new Date(), candidateId, clean_(p.vacancyId), clean_(p.roleTitle),
      'New', sourceValue_(p), '', '', new Date()
    ]);
    logActivity_('Application', appId, 'Created', 'Candidate ' + candidateId);
  }

  notify_('New candidate submission: ' + candidateId, buildEmailBody_('Candidate', candidateId, p));
  return { id: candidateId, duplicate: Boolean(duplicate), message: 'Thank you. Your details have been received.' };
}

function findOrCreateEmployer_(p) {
  const sheet = getSpreadsheet_().getSheetByName(SHEETS.EMPLOYERS);
  const data = sheet.getDataRange().getValues();
  const target = normalise_(p.organisation);

  for (let i = 1; i < data.length; i++) {
    if (normalise_(data[i][2]) === target) return data[i][0];
  }

  const id = nextId_('EMP');
  sheet.appendRow([
    id, new Date(), clean_(p.organisation), clean_(p.organisationWebsite || p.websiteUrl),
    clean_(p.industry), clean_(p.address), 'Prospect', '', '', new Date()
  ]);
  logActivity_('Employer', id, 'Created', clean_(p.organisation));
  return id;
}

function findOrCreateEmployerContact_(p, employerId) {
  const sheet = getSpreadsheet_().getSheetByName(SHEETS.CONTACTS);
  const data = sheet.getDataRange().getValues();
  const email = normalise_(p.email);

  for (let i = 1; i < data.length; i++) {
    if (normalise_(data[i][6]) === email) return data[i][0];
  }

  const id = nextId_('ECT');
  sheet.appendRow([
    id, new Date(), employerId, clean_(p.organisation), clean_(p.contactName),
    clean_(p.jobTitle), clean_(p.email), clean_(p.telephone),
    clean_(p.preferredContact), 'Active', '', '', new Date()
  ]);
  logActivity_('Employer Contact', id, 'Created', clean_(p.contactName));
  return id;
}

function findCandidateByEmail_(email) {
  const sheet = getSpreadsheet_().getSheetByName(SHEETS.CANDIDATES);
  const data = sheet.getDataRange().getValues();
  const target = normalise_(email);
  for (let i = 1; i < data.length; i++) {
    if (normalise_(data[i][4]) === target) return data[i][0];
  }
  return '';
}

function updateCandidate_(candidateId, p, cvLink) {
  const sheet = getSpreadsheet_().getSheetByName(SHEETS.CANDIDATES);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === candidateId) {
      const existingCv = data[i][11] || '';
      sheet.getRange(i + 1, 3, 1, 17).setValues([[
        clean_(p.firstName) || data[i][2],
        clean_(p.lastName) || data[i][3],
        clean_(p.email) || data[i][4],
        clean_(p.telephone) || data[i][5],
        clean_(p.location) || data[i][6],
        clean_(p.country) || data[i][7],
        clean_(p.profession) || data[i][8],
        clean_(p.currentJobTitle) || data[i][9],
        clean_(p.linkedin) || data[i][10],
        cvLink || existingCv,
        consentValue_(p) || data[i][12],
        marketingConsentValue_(p) || data[i][13],
        sourceValue_(p) || data[i][14],
        data[i][15] || 'New',
        data[i][16] || '',
        clean_(p.notes) || data[i][17] || '',
        new Date()
      ]]);
      return;
    }
  }
}

function saveOptionalFile_(p, field, folderName, recordId) {
  const data = p[field + 'Base64'] || p[field + '_base64'];
  const filename = p[field + 'Name'] || p[field + '_name'];
  const suppliedMimeType = p[field + 'Type'] || p[field + '_type'];

  if (!data || !filename) return '';
  const extension = String(filename).split('.').pop().toLowerCase();
  if (!CONFIG.ALLOWED_FILE_EXTENSIONS.includes(extension)) {
    throw new Error('Unsupported file type for ' + field + '.');
  }

  const bytes = Utilities.base64Decode(String(data).replace(/^data:.*;base64,/, ''));
  if (bytes.length > CONFIG.MAX_FILE_BYTES) {
    throw new Error('Uploaded file exceeds the 5 MB limit.');
  }

  const folder = getChildFolder_(folderName);
  const safeName = recordId + '_' + String(filename).replace(/[^\w.\- ]/g, '_');
  const mimeType = resolveMimeType_(extension, suppliedMimeType);
  const blob = Utilities.newBlob(bytes, mimeType, safeName);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  file.setDescription('Submitted through the Optima website. Retain only under the approved data-retention policy.');
  return file.getUrl();
}

function resolveMimeType_(extension, suppliedMimeType) {
  const map = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  };
  const supplied = String(suppliedMimeType || '').trim();
  return supplied && supplied !== 'application/octet-stream' ? supplied : map[extension];
}

function ensureDashboard_(ss) {
  let sheet = ss.getSheetByName(SHEETS.DASHBOARD);
  if (!sheet) sheet = ss.insertSheet(SHEETS.DASHBOARD, 0);
  sheet.clear();

  sheet.getRange('A1:B1').setValues([['Optima Recruitment Backend Dashboard','']]);
  sheet.getRange('A3:B10').setValues([
    ['Metric','Value'],
    ['Employers', `=MAX(COUNTA('${SHEETS.EMPLOYERS}'!A:A)-1,0)`],
    ['Employer Contacts', `=MAX(COUNTA('${SHEETS.CONTACTS}'!A:A)-1,0)`],
    ['Vacancies', `=MAX(COUNTA('${SHEETS.VACANCIES}'!A:A)-1,0)`],
    ['Candidates', `=MAX(COUNTA('${SHEETS.CANDIDATES}'!A:A)-1,0)`],
    ['Applications', `=MAX(COUNTA('${SHEETS.APPLICATIONS}'!A:A)-1,0)`],
    ['Consultations', `=MAX(COUNTA('${SHEETS.CONSULTATIONS}'!A:A)-1,0)`],
    ['Enquiries', `=MAX(COUNTA('${SHEETS.ENQUIRIES}'!A:A)-1,0)`]
  ]);

  sheet.getRange('D3:E8').setValues([
    ['Pipeline','Count'],
    ['New Vacancies', `=COUNTIF('${SHEETS.VACANCIES}'!T:T,"New")`],
    ['New Candidates', `=COUNTIF('${SHEETS.CANDIDATES}'!P:P,"New")`],
    ['New Applications', `=COUNTIF('${SHEETS.APPLICATIONS}'!F:F,"New")`],
    ['New Consultations', `=COUNTIF('${SHEETS.CONSULTATIONS}'!L:L,"New")`],
    ['New Enquiries', `=COUNTIF('${SHEETS.ENQUIRIES}'!K:K,"New")`]
  ]);

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, 5);
}

function ensureSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.autoResizeColumns(1, headers.length);

  const statusIndex = headers.indexOf('Status') + 1;
  if (statusIndex > 0) {
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['New','Prospect','Active','In Progress','Interview','Placed','Filled','Closed','Archived'], true)
      .setAllowInvalid(true)
      .build();
    sheet.getRange(2, statusIndex, Math.max(sheet.getMaxRows() - 1, 1), 1).setDataValidation(rule);
  }
}

function appendRecord_(sheetName, row) {
  getSpreadsheet_().getSheetByName(sheetName).appendRow(row);
}

function nextId_(prefix) {
  const props = PropertiesService.getScriptProperties();
  const key = 'COUNTER_' + prefix;
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const current = Number(props.getProperty(key) || 0) + 1;
    props.setProperty(key, String(current));
    return prefix + '-' + String(current).padStart(6, '0');
  } finally {
    lock.releaseLock();
  }
}

function logActivity_(recordType, recordId, action, details) {
  try {
    appendRecord_(SHEETS.ACTIVITY, [
      nextId_('ACT'), new Date(), recordType, recordId, action, details || '',
      Session.getActiveUser().getEmail() || 'Web App'
    ]);
  } catch (error) {
    console.error(error);
  }
}

function logError_(context, error, payload) {
  try {
    appendRecord_(SHEETS.ERRORS, [
      nextId_('ERR'), new Date(), context, error.message || String(error),
      error.stack || '', JSON.stringify(payload || {})
    ]);
  } catch (loggingError) {
    console.error(loggingError);
  }
}

function notify_(subject, body) {
  if (!CONFIG.BUSINESS_EMAIL || CONFIG.BUSINESS_EMAIL.includes('REPLACE_')) return;
  MailApp.sendEmail({
    to: CONFIG.BUSINESS_EMAIL,
    subject: '[' + CONFIG.BUSINESS_NAME + '] ' + subject,
    htmlBody: body,
    name: CONFIG.BUSINESS_NAME
  });
}

function buildEmailBody_(recordType, recordId, p) {
  const rows = Object.keys(p)
    .filter(k => !/base64/i.test(k))
    .map(k => '<tr><td style="padding:6px;border:1px solid #ddd"><strong>' +
      escapeHtml_(k) + '</strong></td><td style="padding:6px;border:1px solid #ddd">' +
      escapeHtml_(String(p[k] ?? '')).replace(/\n/g, '<br>') + '</td></tr>')
    .join('');

  return '<h2>' + escapeHtml_(recordType) + ' received</h2>' +
    '<p><strong>Record ID:</strong> ' + escapeHtml_(recordId) + '</p>' +
    '<table style="border-collapse:collapse">' + rows + '</table>';
}

function parseRequest_(e) {
  if (!e) throw new Error('No request data received.');

  const raw = e.postData && e.postData.contents ? e.postData.contents : '';
  const type = e.postData && e.postData.type ? e.postData.type : '';

  if (raw && (type.includes('application/json') || type.includes('text/plain'))) {
    try { return JSON.parse(raw); } catch (_) {}
  }

  return e.parameter || {};
}

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties()
    .getProperty(CONFIG.SCRIPT_PROPERTY_SPREADSHEET_ID);
  if (!id) throw new Error('Backend not configured. Run setupOptimaBackend() first.');
  return SpreadsheetApp.openById(id);
}

function getRootFolder_() {
  const id = PropertiesService.getScriptProperties()
    .getProperty(CONFIG.SCRIPT_PROPERTY_ROOT_FOLDER_ID);
  if (!id) throw new Error('Backend folder not configured.');
  return DriveApp.getFolderById(id);
}

function getChildFolder_(name) {
  const root = getRootFolder_();
  const folders = root.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : root.createFolder(name);
}

function validateConfiguration_() {
  if (!CONFIG.BUSINESS_EMAIL || CONFIG.BUSINESS_EMAIL.includes('REPLACE_')) {
    throw new Error('Replace REPLACE_WITH_YOUR_BUSINESS_EMAIL in CONFIG before setup.');
  }
}

function requireFields_(p, fields) {
  const missing = fields.filter(f => !String(p[f] || '').trim());
  if (missing.length) throw new Error('Missing required field(s): ' + missing.join(', '));
}

function validateEmail_(email) {
  const value = String(email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error('Invalid email address.');
}

function requireConsent_(p) {
  const value = p.gdprConsent ?? p.gdpr_consent ?? p.consent;
  const accepted = value === true || value === 'true' || value === 'yes' ||
    value === 'on' || value === '1' || value === 1;
  if (!accepted) throw new Error('Privacy consent is required.');
}

function consentValue_(p) {
  return String(p.gdprConsent ?? p.gdpr_consent ?? p.consent ?? '');
}

function marketingConsentValue_(p) {
  return String(p.marketingConsent ?? p.marketing_consent ?? '');
}

function sourceValue_(p) {
  return clean_(p.source || p.pageUrl || p.page_url || 'Website');
}

function normalise_(value) {
  return String(value || '').trim().toLowerCase();
}

function clean_(value) {
  return String(value ?? '').trim().replace(/^[=+\-@]/, "'$&");
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function responseForRequest_(payload, obj) {
  const mode = normalise_(payload && (payload.responseMode || payload.response_mode));
  return mode === 'iframe' ? iframeResponse_(payload, obj) : jsonResponse_(obj);
}

function iframeResponse_(payload, obj) {
  const message = Object.assign({
    source: 'optima-recruitment-backend',
    requestId: String((payload && payload.requestId) || '')
  }, obj);
  const serialised = JSON.stringify(message)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
  const targetOrigin = permittedTargetOrigin_(payload && (payload.pageOrigin || payload.page_origin));
  const html = '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
    '<script>window.parent.postMessage(' + serialised + ',' + JSON.stringify(targetOrigin) + ');<\\/script>' +
    '</body></html>';
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function permittedTargetOrigin_(origin) {
  const value = String(origin || '').trim();
  const allowed = [
    'https://optimasolutionsintl.com',
    'https://www.optimasolutionsintl.com',
    'https://cell123321.github.io'
  ];
  return allowed.includes(value) ? value : '*';
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}