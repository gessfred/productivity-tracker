variable "github_sha" {
  
}

variable "db_password" {
  
}

data "aws_iam_policy_document" "reporting_lambda_policy" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "reporting_role" {
  name               = "hotkey-reporting-role"
  assume_role_policy = data.aws_iam_policy_document.reporting_lambda_policy.json
}


resource "aws_lambda_function" "reporting_lambda" {
    function_name = "hotkey-reporting-function"
    role = aws_iam_role.reporting_role.arn
    image_uri = "663234259711.dkr.ecr.us-east-1.amazonaws.com/hotkey/reporting:${var.github_sha}"
    package_type = "Image"
    timeout = 120
    environment {
        variables = {
            DB_CONNECTION_STRING = "postgresql://doadmin:${var.db_password}@db-postgresql-fra1-33436-do-user-6069962-0.b.db.ondigitalocean.com:25060/keylogger"
        }
    }
}

resource "aws_security_group" "default_sg" {
  name        = "hotkey_default_sg"
  description = "Allow all traffic"

  ingress {
    description = "Allow from all IPv4 addresses"
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_cloudwatch_event_rule" "reporting_cron" {
  name                = "hotkey-reporting-cron"
  description         = "Trigger Lambda every Sunday"
  schedule_expression = "cron(59 23 ? * SUN *)"
}

resource "aws_cloudwatch_event_target" "lambda_reporting_schedule" {
  rule      = aws_cloudwatch_event_rule.reporting_cron.name
  target_id = "TriggerLambdaFunction"
  arn       = aws_lambda_function.reporting_lambda.arn  # replace with your Lambda function ARN
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.reporting_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.reporting_cron.arn
}