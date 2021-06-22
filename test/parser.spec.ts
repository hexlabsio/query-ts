import {Evaluator, Parser} from "../src";

const testValue = {
  "resource": {
    "arn": "arn:aws:acm:eu-west-1:6628835:custom-domain-name/api.dev.klouds.io",
    "service": "API Gateway",
    "type": "Custom Domain Name",
    "region": "eu-west-1",
    "category": "Networking and Content Delivery",
    "created": "2051-06-22T09:48:50.072Z",
    "awsAccountId": "662155",
    "name": "api.dev.klouds.io",
    "aliases": [],
    "properties": [
      {
        "key": "certificateArn",
        "label": "Certificate Arn",
        "value": "arn:aws:acm:us-east-1:6168835:certificate/d3123e24-"
      },
      {
        "key": "domainName",
        "label": "Domain Name",
        "value": "api.dev.klouds.io"
      },
      {
        "key": "endpointConfiguration",
        "label": "Endpoint Configuration",
        "value": {
          "types": [
            "EDGE"
          ]
        }
      },
      {
        "key": "domainNameStatus",
        "label": "Domain Name Status",
        "value": "AVAILABLE"
      }
    ]
  },
  "tags": {
    "a": "xyz"
  }
};
describe('Parser', () => {
  it('should', () => {
    const query = '$tags.a';
    const parts = Parser.parse(query);
    console.log(Evaluator.from(testValue).evaluate(parts));
  })
});
