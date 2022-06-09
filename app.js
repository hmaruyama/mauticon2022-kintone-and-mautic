(function(swal) {
  'use strict';

  const clientId = 'YOUR_MAUTIC_CLIENT_ID';
  const clientSecret = 'YOUR_MAUTIC_CLIENT_SECRET';
  const mauticDomain = 'https://YOUR-MAUTIC-DOMAIN';
  let authToken = '';
  let contactId

  // sweetalert
  function showSwalQues(events) {
    return swal({
      title: '活動履歴',
      html: events
    });
  }

  // ボタン生成
  function createPutButton() {
    const button = new kintoneUIComponent.Button({
      text: 'MA側のアクティビティを確認する',
      type: 'normal'
    });
    kintone.app.record.getHeaderMenuSpaceElement().appendChild(button.render());
    return button;
  }

  // アクセストークン取得
  function getAuthToken() {
    const url = mauticDomain + '/oauth/v2/token?' +
      'grant_type=client_credentials&client_id=' + clientId +
      '&client_secret=' + clientSecret;

    return kintone.proxy(url, 'GET', {}, {})
      .then(function(resp) {
          const obj = JSON.parse(resp[0]);
          return obj;
    });
  }

  // Mauticのコンタクトを特定
  function getContact(authToken, record) {
    const url = mauticDomain + '/api/contacts?access_token=' + authToken + '&search=email:' + record.email.value;
    return kintone.proxy(url, 'GET', {}, {})
      .then(function(resp) {
        const obj = JSON.parse(resp[0]);
        return obj;
    });
  }

  // 該当コンタクトの活動履歴を取得
  function getContactActivity(authToken, contactID) {
    const url = mauticDomain + '/api/contacts/' + contactID + '/activity?access_token=' + authToken;
    return kintone.proxy(url, 'GET', {}, {})
      .then(function(resp) {
        const obj = JSON.parse(resp[0]);
        return obj;
    });
  }

  // ボタンを押したときに動く
  function buttonAction(button, record) {
    const spinner = new kintoneUIComponent.Spinner();
    kintone.app.record.getHeaderMenuSpaceElement().appendChild(spinner.render());
    button.on('click', function(e) {
      spinner.show();
      return getContactActivity(authToken, contactId).then(function(resp) {
        let events = '';
        for (let event = 0; event < resp.events.length; event++) {
          events += '<li>' + resp.events[event].eventType + ': ' + resp.events[event].eventLabel.label + '</li>';
        }
        events = '<ul>' + events + '</ul>';
        spinner.hide();
        return showSwalQues(events);
      });
    });
  }

  kintone.events.on('app.record.detail.show', function(event) {
    const record = event.record;
    return getAuthToken().then(function(authResp) {
      authToken = authResp.access_token;
      return getContact(authToken, record);
    }).then(function(resp) {
      if (resp.total === '0') { return event };
      contactId = Object.keys(resp.contacts)[0];
      const putButton = createPutButton();
      buttonAction(putButton, record);
      return event;
    });
  });

})(swal);