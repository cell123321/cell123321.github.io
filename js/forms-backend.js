(function () {
  'use strict';

  var ENDPOINT = 'https://script.google.com/a/macros/optimasolutionsintl.com/s/AKfycbzF1thaAD1eG3YBwHFGqOl8fcgrvi_qHdfV3c6LGpmy32kiBegNg-yBzB1le_pz_mTA/exec';
  var MAX_FILE_BYTES = 5 * 1024 * 1024;
  var ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx'];
  var RESPONSE_SOURCE = 'optima-recruitment-backend';
  var RESPONSE_TIMEOUT_MS = 90000;

  function endpointConfigured() {
    return /^https:\/\/script\.google\.com\/(?:a\/macros\/[^/]+\/)?s\/[^/]+\/exec$/.test(ENDPOINT);
  }

  function trustedResponseOrigin(origin) {
    return origin === 'https://script.google.com' ||
      origin === 'https://script.googleusercontent.com';
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
    return lines.filter(function (line) { return String(line || '').trim(); }).join('\n');
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

  function requestId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'optima-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  }

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file) return resolve(null);
      var extension = (file.name.split('.').pop() || '').toLowerCase();
      if (ALLOWED_EXTENSIONS.indexOf(extension) === -1) {
        return reject(new Error('Please upload a PDF, DOC, DOCX, PPT or PPTX file.'));
      }
      if (file.size > MAX_FILE_BYTES) {
        return reject(new Error('The uploaded file must be 5 MB or smaller.'));
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
      responseMode: 'iframe',
      requestId: requestId(),
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
      payload.linkedin = value(fields, 'linkedin_profile');
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
      status.focus({ preventScroll: true });
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

  function addHiddenField(form, name, valueToAdd) {
    var element;
    if (/Base64$/.test(name)) {
      element = document.createElement('textarea');
    } else {
      element = document.createElement('input');
      element.type = 'hidden';
    }
    element.name = name;
    element.value = valueToAdd == null ? '' : String(valueToAdd);
    form.appendChild(element);
  }

  function submitViaIframe(payload) {
    return new Promise(function (resolve, reject) {
      var iframe = document.createElement('iframe');
      var frameName = 'optima-submit-' + payload.requestId.replace(/[^a-zA-Z0-9_-]/g, '');
      iframe.name = frameName;
      iframe.title = 'Secure form submission';
      iframe.style.display = 'none';

      var postForm = document.createElement('form');
      postForm.method = 'POST';
      postForm.action = ENDPOINT;
      postForm.target = frameName;
      postForm.acceptCharset = 'UTF-8';
      postForm.style.display = 'none';

      Object.keys(payload).forEach(function (key) {
        if (payload[key] !== undefined && payload[key] !== null) addHiddenField(postForm, key, payload[key]);
      });

      var settled = false;
      var timeoutId;

      function cleanup() {
        window.removeEventListener('message', onMessage);
        if (timeoutId) window.clearTimeout(timeoutId);
        window.setTimeout(function () {
          if (postForm.parentNode) postForm.parentNode.removeChild(postForm);
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }, 0);
      }

      function onMessage(event) {
        if (!trustedResponseOrigin(event.origin)) return;
        var data = event.data;
        if (!data || data.source !== RESPONSE_SOURCE || data.requestId !== payload.requestId) return;
        if (settled) return;
        settled = true;
        cleanup();
        if (data.success === true) resolve(data);
        else reject(new Error(data.message || 'The submission could not be completed.'));
      }

      window.addEventListener('message', onMessage);
      document.body.appendChild(iframe);
      document.body.appendChild(postForm);

      timeoutId = window.setTimeout(function () {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error('The submission timed out. Please check your connection and try again.'));
      }, RESPONSE_TIMEOUT_MS);

      postForm.submit();
    });
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
      var file = fileInput && fileInput.files && fileInput.files[0] ? await readFile(fileInput.files[0]) : null;
      var payload = buildPayload(form, fields, file);
      var result = await submitViaIframe(payload);
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

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('form[data-optima-form]').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        submitForm(form);
      });
    });
  });
})();
