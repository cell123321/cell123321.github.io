(function () {
  'use strict';

  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbzF1thaAD1eG3YBwHFGqOl8fcgrvi_qHdfV3c6LGpmy32kiBegNg-yBzB1le_pz_mTA/exec';
  var MAX_FILE_BYTES = 5 * 1024 * 1024;
  var ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx'];
  var CONFIRMATION_TIMEOUT_MS = 120000;
  var POLL_INTERVAL_MS = 1500;
  var POLL_REQUEST_TIMEOUT_MS = 12000;

  function endpointConfigured() {
    return /^https:\/\/script\.google\.com\/(?:a\/macros\/[^/]+\/|macros\/)s\/[^/]+\/exec$/.test(ENDPOINT);
  }

  function collectFields(form) {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field || field.disabled || field.type === 'file' || field.type === 'submit') return;
      var name = field.name || field.id || '';
      if (!name) return;

      if (field.type === 'checkbox') {
        data[name] = field.checked;
      } else if (field.type === 'radio') {
        if (field.checked) data[name] = field.value;
      } else {
        data[name] = String(field.value || '').trim();
      }
    });
    return data;
  }

  function value(fields, name) {
    return String(fields[name] == null ? '' : fields[name]).trim();
  }

  function checked(fields, name) {
    return fields[name] === true || fields[name] === 'true' || fields[name] === 'on' || fields[name] === '1';
  }

  function yesNo(valueToCheck) {
    return valueToCheck ? 'Yes' : 'No';
  }

  function combineLines(lines) {
    return lines.filter(function (line) {
      return String(line || '').trim();
    }).join('\n');
  }

  function splitFullName(fullName) {
    var parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { firstName: '', lastName: '' };
    if (parts.length === 1) return { firstName: parts[0], lastName: 'Not provided' };
    return {
      firstName: parts.slice(0, -1).join(' '),
      lastName: parts[parts.length - 1]
    };
  }

  function createRequestId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'optima-' + Date.now() + '-' + Math.random().toString(36).slice(2, 14);
  }

  function readFile(file, allowedExtensions) {
    return new Promise(function (resolve, reject) {
      if (!file) {
        resolve(null);
        return;
      }

      var extension = (file.name.split('.').pop() || '').toLowerCase();
      var permitted = allowedExtensions || ALLOWED_EXTENSIONS;
      if (permitted.indexOf(extension) === -1) {
        reject(new Error(permitted.indexOf('ppt') >= 0
          ? 'Please upload a PDF, DOC, DOCX, PPT or PPTX file.'
          : 'Please upload a PDF, DOC or DOCX file.'));
        return;
      }

      if (file.size > MAX_FILE_BYTES) {
        reject(new Error('The uploaded file must be 5 MB or smaller.'));
        return;
      }

      var reader = new FileReader();
      reader.onload = function () {
        var result = String(reader.result || '');
        resolve({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          base64: result.indexOf(',') >= 0 ? result.slice(result.indexOf(',') + 1) : result
        });
      };
      reader.onerror = function () {
        reject(new Error('The selected file could not be read. Please select it again.'));
      };
      reader.readAsDataURL(file);
    });
  }

  function buildPayload(form, fields, file) {
    var type = String(form.dataset.formType || '').toLowerCase();
    var payload = {
      formType: type,
      submittedAt: new Date().toISOString(),
      pageUrl: window.location.href,
      pageOrigin: window.location.origin,
      source: 'Optima website — ' + type + ' form',
      requestId: createRequestId(),
      website: value(fields, 'website')
    };

    if (type === 'contact') {
      payload.name = value(fields, 'name');
      payload.email = value(fields, 'email');
      payload.subject = value(fields, 'subject');
      payload.message = value(fields, 'message');
      payload.gdprConsent = checked(fields, 'privacy-consent');
      return payload;
    }

    if (type === 'consultation') {
      payload.name = value(fields, 'name');
      payload.organisation = value(fields, 'organisation');
      payload.email = value(fields, 'email');
      payload.telephone = value(fields, 'telephone');
      payload.service = value(fields, 'service_required');
      payload.preferredMethod = value(fields, 'preferred_method');
      payload.message = combineLines([
        value(fields, 'preferred_method') ? 'Preferred contact method: ' + value(fields, 'preferred_method') : '',
        value(fields, 'business_requirements') ? 'Business requirements:\n' + value(fields, 'business_requirements') : ''
      ]);
      payload.gdprConsent = checked(fields, 'privacy-consent');
      return payload;
    }

    if (type === 'vacancy') {
      var salaryParts = [value(fields, 'currency'), value(fields, 'salary_or_rate')].filter(Boolean).join(' ');
      if (salaryParts && value(fields, 'pay_frequency')) salaryParts += ' per ' + value(fields, 'pay_frequency');

      payload.organisation = value(fields, 'organisation');
      payload.contactName = value(fields, 'contact_name');
      payload.email = value(fields, 'email');
      payload.telephone = value(fields, 'telephone');
      payload.roleTitle = value(fields, 'role_title');
      payload.location = value(fields, 'location');
      payload.employmentType = value(fields, 'employment_type');
      payload.salary = salaryParts;
      payload.numberOfPositions = value(fields, 'number_of_positions');
      payload.startDate = value(fields, 'specific_start_date') || value(fields, 'start_date_preference');
      payload.workplace = value(fields, 'workplace');
      payload.hiringUrgency = value(fields, 'hiring_urgency');
      payload.clientAuthority = checked(fields, 'client-authority');
      payload.notes = combineLines([
        value(fields, 'support_required') ? 'Support required: ' + value(fields, 'support_required') : '',
        value(fields, 'brief') ? 'Vacancy brief:\n' + value(fields, 'brief') : '',
        'International recruitment or relocation support: ' + yesNo(checked(fields, 'international_relocation')),
        'Consultation requested: ' + yesNo(checked(fields, 'consultation_requested')),
        'Authority to submit confirmed: ' + yesNo(checked(fields, 'client-authority'))
      ]);
      payload.gdprConsent = checked(fields, 'privacy-consent');

      if (file) {
        payload.jobDescriptionBase64 = file.base64;
        payload.jobDescriptionName = file.name;
        payload.jobDescriptionType = file.type;
      }
      return payload;
    }

    if (type === 'candidate') {
      var name = splitFullName(value(fields, 'full_name'));
      payload.firstName = name.firstName;
      payload.lastName = name.lastName;
      payload.fullName = value(fields, 'full_name');
      payload.email = value(fields, 'email');
      payload.telephone = value(fields, 'telephone');
      payload.location = value(fields, 'preferred_location');
      payload.country = '';
      payload.profession = value(fields, 'industry');
      payload.currentJobTitle = value(fields, 'career_goal');
      payload.roleTitle = String(form.dataset.jobTitle || '').trim();
      payload.linkedin = value(fields, 'linkedin_profile');
      payload.candidateConfirmation = checked(fields, 'candidate-confirmation');
      payload.marketingConsent = checked(fields, 'future-opportunities');
      payload.notes = combineLines([
        value(fields, 'preferred_arrangement') ? 'Preferred arrangement: ' + value(fields, 'preferred_arrangement') : '',
        value(fields, 'career_goal') ? 'Career objective: ' + value(fields, 'career_goal') : '',
        value(fields, 'experience_and_objectives') ? 'Experience and objectives:\n' + value(fields, 'experience_and_objectives') : '',
        'Relocation support requested: ' + yesNo(checked(fields, 'relocation_support')),
        'Information accuracy confirmed: ' + yesNo(checked(fields, 'candidate-confirmation')),
        'Future opportunities consent: ' + yesNo(checked(fields, 'future-opportunities'))
      ]);
      payload.gdprConsent = checked(fields, 'privacy-consent');

      if (file) {
        payload.cvBase64 = file.base64;
        payload.cvName = file.name;
        payload.cvType = file.type;
      }
      return payload;
    }

    throw new Error('This form type is not supported.');
  }

  function setStatus(form, message, state) {
    var status = form.querySelector('.form-status');
    if (!status) return;

    status.textContent = message;
    status.dataset.state = state || '';
    status.setAttribute('role', state === 'error' ? 'alert' : 'status');

    if (state === 'success' || state === 'error') {
      status.setAttribute('tabindex', '-1');
      try {
        status.focus({ preventScroll: true });
      } catch (error) {
        status.focus();
      }
    }
  }

  function setSubmitting(form, submitting) {
    var button = form.querySelector('button[type="submit"]');
    if (!button) return;

    if (!button.dataset.originalText) button.dataset.originalText = button.textContent;
    button.disabled = submitting;
    button.setAttribute('aria-busy', submitting ? 'true' : 'false');
    button.textContent = submitting ? 'Submitting…' : button.dataset.originalText;
  }

  function submitPayload(payload) {
    if (!window.fetch) {
      return Promise.reject(new Error('Your browser cannot use the secure submission service. Please update your browser or contact Optima directly.'));
    }

    return window.fetch(ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8'
      },
      body: JSON.stringify(payload)
    });
  }

  function validStatusResponse(data, requestId) {
    return data && data.requestId === requestId &&
      (data.status === 'pending' || data.status === 'processing' || data.status === 'complete');
  }

  function requestStatus(requestId, attempt) {
    return new Promise(function (resolve, reject) {
      var callbackName = '__optimaStatus_' + requestId.replace(/[^a-zA-Z0-9_$]/g, '') + '_' + attempt;
      var script = document.createElement('script');
      var completed = false;
      var timeoutId;

      function cleanup() {
        if (timeoutId) window.clearTimeout(timeoutId);
        try {
          delete window[callbackName];
        } catch (error) {
          window[callbackName] = undefined;
        }
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[callbackName] = function (data) {
        if (completed) return;
        completed = true;
        cleanup();
        if (!validStatusResponse(data, requestId)) {
          reject(new Error('The backend returned an invalid confirmation response.'));
          return;
        }
        resolve(data);
      };

      script.onerror = function () {
        if (completed) return;
        completed = true;
        cleanup();
        reject(new Error('The confirmation service could not be reached.'));
      };

      timeoutId = window.setTimeout(function () {
        if (completed) return;
        completed = true;
        cleanup();
        reject(new Error('The confirmation request timed out.'));
      }, POLL_REQUEST_TIMEOUT_MS);

      script.async = true;
      script.src = ENDPOINT +
        '?action=status' +
        '&requestId=' + encodeURIComponent(requestId) +
        '&callback=' + encodeURIComponent(callbackName) +
        '&_=' + Date.now();
      document.head.appendChild(script);
    });
  }

  async function waitForConfirmation(requestId) {
    var started = Date.now();
    var attempt = 0;
    var lastError = null;

    while (Date.now() - started < CONFIRMATION_TIMEOUT_MS) {
      attempt += 1;
      try {
        var status = await requestStatus(requestId, attempt);
        if (status.status === 'complete') return status;
      } catch (error) {
        lastError = error;
      }

      await new Promise(function (resolve) {
        window.setTimeout(resolve, POLL_INTERVAL_MS);
      });
    }

    throw new Error(lastError && lastError.message
      ? 'The submission was sent, but confirmation was delayed. Please do not submit it repeatedly. Contact Optima if you do not receive a response.'
      : 'The submission was sent, but confirmation was delayed. Please do not submit it repeatedly. Contact Optima if you do not receive a response.');
  }

  async function submitForm(form) {
    if (!form.reportValidity()) return;

    if (!endpointConfigured()) {
      setStatus(form, 'This form is awaiting secure backend activation. Please contact Optima directly.', 'error');
      return;
    }

    var fields = collectFields(form);
    if (value(fields, 'website')) {
      form.reset();
      setStatus(form, 'Thank you. Your submission has been received.', 'success');
      return;
    }

    setSubmitting(form, true);
    setStatus(form, 'Securely submitting your information…', 'pending');

    try {
      var fileInput = form.querySelector('input[type="file"]');
      var fileExtensions = String(form.dataset.formType || '').toLowerCase() === 'candidate'
        ? ['pdf', 'doc', 'docx']
        : ALLOWED_EXTENSIONS;
      var file = fileInput && fileInput.files && fileInput.files[0]
        ? await readFile(fileInput.files[0], fileExtensions)
        : null;
      var payload = buildPayload(form, fields, file);

      await submitPayload(payload);
      setStatus(form, 'Submission sent. Confirming receipt…', 'pending');

      var result = await waitForConfirmation(payload.requestId);
      if (result.success !== true) {
        throw new Error(result.message || 'The submission could not be completed.');
      }

      form.reset();
      var reference = result.id ? ' Reference: ' + result.id + '.' : '';
      setStatus(form, (result.message || 'Thank you. Your submission has been received securely.') + reference, 'success');
    } catch (error) {
      console.error(error);
      setStatus(form, error.message || 'We could not submit the form. Please try again or contact Optima directly.', 'error');
    } finally {
      setSubmitting(form, false);
    }
  }

  function applyJobContext(form) {
    if (String(form.dataset.formType || '').toLowerCase() !== 'candidate') return;
    var jobTitle = new URLSearchParams(window.location.search).get('job');
    if (!jobTitle) return;

    form.dataset.jobTitle = jobTitle;
    var careerGoal = form.querySelector('[name="career_goal"]');
    if (careerGoal && !String(careerGoal.value || '').trim()) {
      careerGoal.value = jobTitle;
    }
  }

  function initialiseForms() {
    document.querySelectorAll('form[data-optima-form]').forEach(function (form) {
      if (form.dataset.optimaInitialised === 'true') return;
      form.dataset.optimaInitialised = 'true';
      applyJobContext(form);
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        submitForm(form);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiseForms);
  } else {
    initialiseForms();
  }
})();
