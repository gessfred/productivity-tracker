terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"

  backend "s3" {
    bucket = "gessfred-xyz-tfstate-us-east-1"
    key    = "tfstates/hotkey"
    region = "us-east-1"
  }
}

provider "aws" {
  region  = "us-east-1"
}