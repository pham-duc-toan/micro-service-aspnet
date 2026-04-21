using Contracts.Common.Interfaces;

namespace Infrastructure.Common;

public class HttpClientHelper : IHttpClientHelper
{
    private readonly HttpClient _httpClient;

    public HttpClientHelper(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<HttpResponseMessage> SendAsync(string path, HttpContent content, HttpMethod method)
    {
        var httpRequest = new HttpRequestMessage()
        {
            RequestUri = new Uri(path),
            Content = content,
            Method = method
        };

        //string token = await _tokenManager.GetTokenAsync(apiResource.Scopes);

        //if (!string.IsNullOrEmpty(token))
        //{
        //    httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        //}

        return await _httpClient.SendAsync(httpRequest);
    }
}
