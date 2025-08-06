// <copyright file="AlertsJob.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>

namespace Synthetic.Jobs
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Microsoft.AlertsMgmt.Contracts;
    using Microsoft.Azure.Geneva.Synthetics.Contracts;
    using Synthetic.Jobs.AlertsFactory;
    using Synthetic.Logic.AlertRules.CrudJobConfigurations;
    using Synthetic.Logic.Alerts;
    using Synthetic.Logic.HttpRequest;
    using Synthetic.Utils;

    /// <summary>
    /// A job for testing Alerts RP.
    /// </summary>
    public class AlertsJob : BaseAlertsJob
    {
        private BaseAlertFactory _alertFactory;
        private AlertsClient _alertsClientForTests;

        /// <summary>
        /// Initializes a new instance of the <see cref="AlertsJob"/> class.
        /// </summary>
        /// <param name="environment">The enviroment.</param>
        public AlertsJob(ISyntheticsEnvironment environment)
            : base(environment)
        {
        }

        /// <inheritdoc/>
        protected override async Task<bool> RunAsyncInternal(CommonJobConfig commonJobConfig, IReadOnlyDictionary<string, string> parameters, CancellationToken cancellationToken, ISyntheticsTracer tracer = null)
        {
            AlertsJobConfig alertsJobConfig = new AlertsJobConfig(parameters, commonJobConfig);
            string environmentName = commonJobConfig.EnvironmentName;

            Alert alert = null;
            AIGApiResponse aigResponse = null;
            try
            {
                (alert, aigResponse) = await this.PrepareAlertsJobs(commonJobConfig, parameters);
            }
            catch (Exception ex)
            {
                this.Tracer.LogError(ex.Message);
                return false;
            }

            IHttpRequestTestCase notFoundtestCase = new AlertNotFoundTestCase(alert, this.Tracer, alertsJobConfig, false);
            IHttpRequestTestCase notFoundtestCaseExtensionAlert = new AlertNotFoundTestCase(alert, this.Tracer, alertsJobConfig, true);
            IHttpRequestTestCase getAlertByIdTestCase = new GetAlertByIdTestCase(this.Tracer, alert, aigResponse, alertsJobConfig, false);
            IHttpRequestTestCase getAlertByIdTestCaseExtensionAlert = new GetAlertByIdTestCase(this.Tracer, alert, aigResponse, alertsJobConfig, true);
            IHttpRequestTestCase getAlertHisotryTestCase = new GetAlertHistoryTestCase(this.Tracer, alert, aigResponse, alertsJobConfig, false, false);
            IHttpRequestTestCase getAlertHisotryTestCaseExtensionWithDetails = new GetAlertHistoryTestCase(this.Tracer, alert, aigResponse, alertsJobConfig, true, true);
            string newState = "Acknowledged";
            string comments = "Test comments";
            string clientPrincipalName = "someone@microsoft.com";
            bool shouldStateChange = true;
            IHttpRequestTestCase changeAlertStateTestCase = new ChangeAlertStateTestCase(this.Tracer, alert, aigResponse, alertsJobConfig, false, newState, comments, clientPrincipalName, shouldStateChange);
            shouldStateChange = false;
            IHttpRequestTestCase getAlertHisotryTestCaseExtensionWithDetailsVerifyStateWasChanged = new GetAlertHistoryTestCase(this.Tracer, alert, aigResponse, alertsJobConfig, true, true, newState, comments, clientPrincipalName);
            IHttpRequestTestCase changeAlertStateTestCaseShouldNotChangeState = new ChangeAlertStateTestCase(this.Tracer, alert, aigResponse, alertsJobConfig, false, newState, comments, clientPrincipalName, shouldStateChange);
            newState = "Closed";
            shouldStateChange = true;
            comments = null;
            clientPrincipalName = null;
            IHttpRequestTestCase changeAlertStateTestCaseWithoutPrincipalAndComments = new ChangeAlertStateTestCase(this.Tracer, alert, aigResponse, alertsJobConfig, false, newState, comments, clientPrincipalName, shouldStateChange);
            IHttpRequestTestCase getAlertHisotryTestCaseExtensionWithDetailsVerifyStateWasChangedWithoutPrincipalAndComments = new GetAlertHistoryTestCase(this.Tracer, alert, aigResponse, alertsJobConfig, true, true, newState, comments, clientPrincipalName);
            IHttpRequestTestCase getEnrichmentsTestCase = new GetEnrichmentsTestCase(this.Tracer, alert, aigResponse, alertsJobConfig, false, false);
            IHttpRequestTestCase getEnrichmentsTestCaseExtensionAlert = new GetEnrichmentsTestCase(this.Tracer, alert, aigResponse, alertsJobConfig, false, true);
            IHttpRequestTestCase getEnrichmentsTestCaseCollection = new GetEnrichmentsTestCase(this.Tracer, alert, aigResponse, alertsJobConfig, true, false);
            IHttpRequestTestCase getEnrichmentsTestCaseCollectionExtensionAlert = new GetEnrichmentsTestCase(this.Tracer, alert, aigResponse, alertsJobConfig, true, true);
            IHttpRequestTestCase getAlertsListTestCase = new GetAlertsListTestCase(this.Tracer, alert, aigResponse, alertsJobConfig, false, environmentName == "PGMS");

            IHttpRequestTestCaseRunner runner = new HttpRequestTestCaseRunner(this.Tracer, this.HttpClientForRunner, cancellationToken);
            var casesList = new List<IHttpRequestTestCase>
                {
                    notFoundtestCase,
                    notFoundtestCaseExtensionAlert,
                    getAlertByIdTestCase,
                    getAlertByIdTestCaseExtensionAlert,
                    getAlertHisotryTestCase,
                    getAlertHisotryTestCaseExtensionWithDetails,
                    changeAlertStateTestCase,
                    getAlertHisotryTestCaseExtensionWithDetailsVerifyStateWasChanged,
                    changeAlertStateTestCaseShouldNotChangeState,
                    changeAlertStateTestCaseWithoutPrincipalAndComments,
                    getAlertHisotryTestCaseExtensionWithDetailsVerifyStateWasChangedWithoutPrincipalAndComments,
                    getEnrichmentsTestCase,
                    getEnrichmentsTestCaseExtensionAlert,
                    getEnrichmentsTestCaseCollection,
                    getEnrichmentsTestCaseCollectionExtensionAlert,
                    getAlertsListTestCase,
                };

            return await runner.RunMultipleTestCasesAsync(casesList);
        }
    }
}
